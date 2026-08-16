/*
 * Add-on: Mailing List Creator
 * Repository: https://github.com/rkfig/Thunderbird-Mailing-List-Creator.git
 * File: src/ui/recipient-dialog/index.js
 * Manifest Version: 2
 * Header Data Scope: Incoming message headers rendered for recipient selection
 * Permission Basis: messagesRead (background fetch), addressBooks (create flow), storage (settings)
 * Compose Permission Note: compose is not required for this incoming-header workflow
 * Purpose: Renders recipient choices, validates user interaction state,
 *          and coordinates create/overwrite requests with the background script.
 * Author: Ryan Figgins
 * Author Email Address: mailing-list-creator@rkfig.com
 */

/* global browser, window, document */

let contextToken = "";
let recipients = [];
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
    empty.textContent = "No To/CC addresses were found in the selected email.";
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

    const displayName = recipient.name ? `${recipient.name} <${recipient.address}>` : recipient.address;
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

  let response = await browser.runtime.sendMessage({
    type: "createMailingList",
    contextToken,
    listName,
    selectedRecipients,
    overwriteExisting: false,
  });

  if (response && response.code === "LIST_EXISTS") {
    const overwrite = window.confirm("A list with that name already exists. Do you want to overwrite it?");
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
    renderRecipients();
  } catch (error) {
    setStatus(error.message || "Unable to load recipients.");
    document.getElementById("recipientSummary").textContent = "No context available";
  }
}

init();
