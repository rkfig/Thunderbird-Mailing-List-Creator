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

/* global browser, window, document, navigator */

let contextToken = "";
let recipients = [];
let addressBooks = [];
let selectedAddressBookId = "";
let isCreating = false;
let pickerWasOpened = false;
let currentPostCreateActions = null;

const DEFAULT_POST_CREATE_ACTIONS = Object.freeze({
  openCreatedList: false,
  keepDialogOpen: false,
  copySummary: false,
});

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function parseContextToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get("contextToken") || "";
}

function setStatus(message) {
  document.getElementById("statusMessage").textContent = message;
}

function setRulesNoteVisible(visible) {
  const note = document.getElementById("rulesNote");
  if (!note) {
    return;
  }

  note.style.display = visible ? "block" : "none";
}

function setNameValidation(message) {
  document.getElementById("nameValidationMessage").textContent = String(message || "");
}

function normalizePostCreateActions(rawActions) {
  const source = rawActions && typeof rawActions === "object" ? rawActions : {};
  return {
    openCreatedList: Boolean(source.openCreatedList),
    keepDialogOpen: Boolean(source.keepDialogOpen),
    copySummary: Boolean(source.copySummary),
  };
}

function updateSummary() {
  const checked = document.querySelectorAll(".recipient-check:checked").length;
  const summary = document.getElementById("recipientSummary");
  summary.textContent = `${checked} of ${recipients.length} recipients selected`;
}

function getSelectedRecipientEmailSet() {
  const selected = new Set();
  const rows = Array.from(document.querySelectorAll(".recipient-check:checked"));
  rows.forEach((input) => {
    const index = Number(input.value);
    if (!Number.isInteger(index) || !recipients[index] || !recipients[index].address) {
      return;
    }
    selected.add(normalizeEmail(recipients[index].address));
  });
  return selected;
}

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

function setCreateInProgress(inProgress) {
  isCreating = inProgress;
  const createButton = document.getElementById("createButton");
  createButton.disabled = inProgress;
  createButton.textContent = inProgress ? "Creating..." : "Create Mailing List";
}

function renderRecipients(selectedEmailSet = null) {
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
    const normalizedEmail = normalizeEmail(recipient.address);
    checkbox.checked = selectedEmailSet ? selectedEmailSet.has(normalizedEmail) : true;
    checkbox.addEventListener("change", onRecipientSelectionChanged);

    const text = document.createElement("span");
    text.className = "recipient-text";
    text.textContent = recipient.name
      ? `${recipient.name} <${recipient.address}>`
      : recipient.address;

    row.appendChild(checkbox);
    row.appendChild(text);
    container.appendChild(row);
  });

  updateSummary();
}

async function loadPostCreateActions() {
  const response = await browser.runtime.sendMessage({ type: "getPostCreateActions" });
  if (!response || !response.ok) {
    throw new Error((response && response.error) || "Unable to load post-creation actions.");
  }

  currentPostCreateActions = normalizePostCreateActions(
    response.actions || DEFAULT_POST_CREATE_ACTIONS
  );
}

async function loadRuleSettings() {
  const response = await browser.runtime.sendMessage({ type: "getRecipientRuleSettings" });
  if (!response || !response.ok) {
    throw new Error((response && response.error) || "Unable to load rule settings.");
  }

  const settings = response.settings && typeof response.settings === "object" ? response.settings : {};
  setRulesNoteVisible(Boolean(settings.enabled));
}

function onRecipientSelectionChanged() {
  updateSummary();
}

async function copyTextToClipboard(text) {
  const value = String(text || "");
  if (!value) {
    return;
  }

  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "readonly");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

async function executePostCreateActions(createResponse, summaryText) {
  const actions = currentPostCreateActions || DEFAULT_POST_CREATE_ACTIONS;
  const warnings = [];

  if (actions.openCreatedList) {
    const response = await browser.runtime.sendMessage({
      type: "executePostCreateActions",
      actions,
      listId: createResponse.listId,
      listName: createResponse.listName,
      addressBookId: document.getElementById("addressBookSelect").value,
      recipientCount: createResponse.recipientCount,
    });

    if (!response || !response.ok) {
      warnings.push((response && response.error) || "Unable to open address book view.");
    }

    const actionWarnings = response && Array.isArray(response.warnings) ? response.warnings : [];
    warnings.push(...actionWarnings);
  }

  if (actions.copySummary) {
    try {
      await copyTextToClipboard(summaryText);
    } catch (_error) {
      warnings.push("Could not copy summary to clipboard.");
    }
  }

  return {
    keepDialogOpen: Boolean(actions.keepDialogOpen),
    warnings,
  };
}

async function onAddFromAddressBookClicked() {
  setStatus("");
  const response = await browser.runtime.sendMessage({
    type: "openAddressBookPicker",
    contextToken,
  });

  if (!response || !response.ok) {
    const message = (response && response.error) || "Unable to open address book picker.";
    setStatus(message);
    return;
  }

  pickerWasOpened = true;
}

function getSelectedRecipients() {
  const selectedIndexes = Array.from(document.querySelectorAll(".recipient-check:checked"))
    .map((input) => Number(input.value))
    .filter((index) => Number.isInteger(index));

  return selectedIndexes
    .map((index) => recipients[index])
    .filter((recipient) => Boolean(recipient && recipient.address));
}

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

async function refreshRecipientsFromContext() {
  const selectedEmailSet = getSelectedRecipientEmailSet();
  await loadContext();
  renderAddressBooks();
  renderRecipients(selectedEmailSet);
}

async function onCreateClicked() {
  if (isCreating) {
    return;
  }

  setCreateInProgress(true);
  setStatus("");
  setNameValidation("");

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
      setCreateInProgress(false);
      return;
    }

    const confirmOverwrite = window.confirm("Are you sure?");
    if (!confirmOverwrite) {
      setStatus("Overwrite canceled. Please enter a different mailing list name.");
      setCreateInProgress(false);
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
    if (response && (response.code === "NO_NAME" || response.code === "SPECIAL_CHAR")) {
      setNameValidation(response.message || "Invalid mailing list name.");
      setCreateInProgress(false);
      return;
    }

    const detail = response && response.details ? ` (${response.details})` : "";
    setStatus(`${(response && response.message) || "Error Creating Mailing List"}${detail}`);
    setCreateInProgress(false);
    return;
  }

  const successSummary = `Created "${response.listName}" with ${response.recipientCount} recipients.`;
  const actionResult = await executePostCreateActions(response, successSummary);
  if (actionResult.warnings.length > 0) {
    setStatus(`${successSummary} ${actionResult.warnings.join(" ")}`);
  } else {
    setStatus(successSummary);
  }

  if (actionResult.keepDialogOpen) {
    setCreateInProgress(false);
    return;
  }

  window.setTimeout(() => {
    window.close();
  }, 700);
}

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

  document.getElementById("addFromAddressBookButton").addEventListener("click", () => {
    onAddFromAddressBookClicked().catch((error) => {
      setStatus(error.message || "Unable to open address book picker.");
    });
  });

  document.getElementById("listName").addEventListener("input", () => {
    setNameValidation("");
  });

  window.addEventListener("focus", () => {
    if (!pickerWasOpened) {
      return;
    }

    refreshRecipientsFromContext().catch((error) => {
      setStatus(error.message || "Unable to refresh recipient list.");
    });
    pickerWasOpened = false;
  });

  contextToken = parseContextToken();
  if (!contextToken) {
    setStatus("Missing creation context token.");
    document.getElementById("recipientSummary").textContent = "No context available";
    return;
  }

  try {
    await loadRuleSettings();
    await loadPostCreateActions();
    await loadContext();
    renderAddressBooks();
    renderRecipients();
  } catch (error) {
    setStatus(error.message || "Unable to load recipients.");
    document.getElementById("recipientSummary").textContent = "No context available";
  }
}

init();
