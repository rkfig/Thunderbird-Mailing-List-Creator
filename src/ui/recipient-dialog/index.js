/*
 * Add-on: Mailing List Creator
 * Repository: https://github.com/rkfig/Thunderbird-Mailing-List-Creator.git
 * File: src/ui/recipient-dialog/index.js
 * Manifest Version: 2
 * Header Data Scope: Incoming message headers rendered for recipient selection
 * Permission Basis: messagesRead (background fetch), addressBooks (create flow)
 * Compose Permission Note: compose is not required for this incoming-header workflow
 * Purpose: Renders recipient choices, validates user interaction state,
 *          and coordinates create/overwrite requests with the background script.
 * Author: Ryan Figgins
 * Author Email Address: 14152271+rkfig@users.noreply.github.com
 */

/* global browser, window, document */

let contextToken = "";
let recipients = [];
let addressBooks = [];
let selectedAddressBookId = "";
let isCreating = false;

// Reads the background-issued context token from the popup URL.
function parseContextToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get("contextToken") || "";
}

// Updates the status line showing how many recipients remain selected.
function updateSummary() {
  const checked = document.querySelectorAll(".recipient-check:checked").length;
  const summary = document.getElementById("recipientSummary");
  summary.textContent = `${checked} of ${recipients.length} recipients selected`;
}

// Shows user-facing status and error messages.
function setStatus(message) {
  document.getElementById("statusMessage").textContent = message;
}

// Draws address book options for the current create operation.
function renderAddressBooks() {
  const select = document.getElementById("addressBookSelect");
  while (select.firstChild) {
    select.removeChild(select.firstChild);
  }

  if (addressBooks.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No writable address books available";
    select.appendChild(option);
    select.disabled = true;
    return;
  }

  addressBooks.forEach((book) => {
    const option = document.createElement("option");
    option.value = book.id;
    option.textContent = book.name;
    select.appendChild(option);
  });

  if (selectedAddressBookId) {
    select.value = selectedAddressBookId;
  }

  select.disabled = false;
}

// Prevents duplicate submissions while create flow is in progress.
function setCreateInProgress(inProgress) {
  isCreating = inProgress;
  const createButton = document.getElementById("createButton");
  createButton.disabled = inProgress;
  createButton.textContent = inProgress ? "Creating..." : "Create Mailing List";
}

// Draws recipient rows using textContent to keep rendering safe and explicit.
function renderRecipients() {
  const container = document.getElementById("recipientContainer");
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  if (recipients.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No Reply-To/From/To/CC/BCC addresses were found in the selected email.";
    container.appendChild(empty);
    const summary = document.getElementById("recipientSummary");
    summary.textContent = "0 of 0 recipients selected";
    return;
  }

  recipients.forEach((recipient, index) => {
    const row = document.createElement("label");
    row.className = "recipient-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "recipient-check";
    checkbox.value = String(index);
    checkbox.checked = true;
    checkbox.addEventListener("change", updateSummary);

    const displayName = recipient.name
      ? `${recipient.name} <${recipient.address}>`
      : recipient.address;
    const text = document.createElement("span");
    text.className = "recipient-text";
    text.textContent = displayName;

    row.appendChild(checkbox);
    row.appendChild(text);
    container.appendChild(row);
  });

  updateSummary();
}

// Converts checked rows into the payload expected by the background script.
function getSelectedRecipients() {
  const selectedIndexes = Array.from(document.querySelectorAll(".recipient-check:checked"))
    .map((input) => Number(input.value))
    .filter((index) => Number.isInteger(index));

  return selectedIndexes
    .map((index) => recipients[index])
    .filter((recipient) => Boolean(recipient && recipient.address));
}

// Pulls recipient context data generated from currently selected messages.
async function loadContext() {
  const response = await browser.runtime.sendMessage({
    type: "getRecipientContext",
    contextToken,
  });

  if (!response || !response.ok) {
    throw new Error((response && response.error) || "Failed to load recipient data.");
  }

  recipients = Array.isArray(response.recipients) ? response.recipients : [];
  addressBooks = Array.isArray(response.addressBooks) ? response.addressBooks : [];
  selectedAddressBookId = String(response.selectedAddressBookId || "");
}

// Orchestrates create flow including duplicate-name overwrite confirmations.
async function onCreateClicked() {
  if (isCreating) {
    return;
  }

  setCreateInProgress(true);
  setStatus("");
  const listName = document.getElementById("listName").value.trim();
  const selectedRecipients = getSelectedRecipients();
  const addressBookId = document.getElementById("addressBookSelect").value;

  if (!addressBookId) {
    setStatus("Select an address book.");
    setCreateInProgress(false);
    return;
  }

  let response = await browser.runtime.sendMessage({
    type: "createMailingList",
    contextToken,
    listName,
    addressBookId,
    selectedRecipients,
    overwriteExisting: false,
  });

  if (response && response.code === "LIST_EXISTS") {
    const overwrite = window.confirm(
      "A list with that name already exists. Do you want to overwrite it?"
    );
    if (!overwrite) {
      setStatus("Please enter a different mailing list name.");
      return;
    }

    const confirmOverwrite = window.confirm("Are you sure?");
    if (!confirmOverwrite) {
      setStatus("Overwrite canceled. Please enter a different mailing list name.");
      return;
    }

    response = await browser.runtime.sendMessage({
      type: "createMailingList",
      contextToken,
      listName,
      addressBookId,
      selectedRecipients,
      overwriteExisting: true,
    });
  }

  if (!response || !response.ok) {
    const detail = response && response.details ? ` (${response.details})` : "";
    setStatus(`${(response && response.message) || "Error Creating Mailing List"}${detail}`);
    setCreateInProgress(false);
    return;
  }

  setStatus(`Created \"${response.listName}\" with ${response.recipientCount} recipients.`);
  window.setTimeout(() => {
    window.close();
  }, 700);
}

// Wires event handlers and performs initial context load.
async function init() {
  document.getElementById("cancelButton").addEventListener("click", () => {
    window.close();
  });
  document.getElementById("createButton").addEventListener("click", () => {
    onCreateClicked().catch((error) => {
      setStatus(error.message || "Unexpected error.");
      setCreateInProgress(false);
    });
  });

  contextToken = parseContextToken();
  if (!contextToken) {
    setStatus("Missing creation context token.");
    document.getElementById("recipientSummary").textContent = "No context available";
    return;
  }

  try {
    await loadContext();
    renderAddressBooks();
    renderRecipients();
  } catch (error) {
    setStatus(error.message || "Unable to load recipients.");
    document.getElementById("recipientSummary").textContent = "No context available";
  }
}

init();
