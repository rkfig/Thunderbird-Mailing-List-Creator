/*
 * Add-on: Mailing List Creator
 * Repository: https://github.com/rkfig/Thunderbird-Mailing-List-Creator.git
 * File: src/ui/address-book-picker/index.js
 * Manifest Version: 2
 * Header Data Scope: Address-book contact selection state and filtering
 * Permission Basis: addressBooks (via background fetch)
 * Purpose: Allows adding extra recipient addresses from one or more address books.
 * Author: Ryan Figgins
 * Author Email Address: 14152271+rkfig@users.noreply.github.com
 */

/* global browser, window, document */

let contextToken = "";
let sourceAddressBooks = [];
let selectedSourceAddressBookId = "";
let contacts = [];
let selectedByEmail = new Map();
let searchTimer = null;
let isSaving = false;
const SELECTION_PREVIEW_LIMIT = 8;

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function parseContextToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get("contextToken") || "";
}

function setStatus(message, isError = false) {
  const status = document.getElementById("statusMessage");
  status.textContent = message;
  status.style.color = isError ? "#b3261e" : "#1d4ed8";
}

function getSelectionCountByBook() {
  const counts = new Map();
  selectedByEmail.forEach((selection) => {
    const bookId = String(selection && selection.sourceAddressBookId ? selection.sourceAddressBookId : "");
    if (!bookId) {
      return;
    }

    counts.set(bookId, (counts.get(bookId) || 0) + 1);
  });
  return counts;
}

function selectedInCurrentViewCount() {
  return document.querySelectorAll(".contact-check:checked").length;
}

function renderSelectionPreview() {
  const title = document.getElementById("selectionPreviewTitle");
  const list = document.getElementById("selectionPreviewList");
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }

  const selections = Array.from(selectedByEmail.values());
  if (selections.length === 0) {
    title.textContent = "Selected addresses (none yet)";
    return;
  }

  title.textContent = `Selected addresses (${selections.length})`;
  selections.slice(0, SELECTION_PREVIEW_LIMIT).forEach((selection) => {
    const item = document.createElement("li");
    const display = selection.name
      ? `${selection.name} <${selection.address}>`
      : selection.address;
    item.textContent = display;
    list.appendChild(item);
  });

  if (selections.length > SELECTION_PREVIEW_LIMIT) {
    const item = document.createElement("li");
    item.textContent = `...and ${selections.length - SELECTION_PREVIEW_LIMIT} more`;
    list.appendChild(item);
  }
}

function updateSummary() {
  const checked = selectedInCurrentViewCount();
  const currentBookName =
    (sourceAddressBooks.find((book) => book.id === selectedSourceAddressBookId) || {}).name ||
    "this address book";
  const currentBookSelectedCount = contacts.filter((recipient) => {
    const key = normalizeEmail(recipient.address);
    const existing = selectedByEmail.get(key);
    return Boolean(existing && existing.sourceAddressBookId === selectedSourceAddressBookId);
  }).length;
  const summary = document.getElementById("contactSummary");
  summary.textContent = `${checked} of ${contacts.length} in this view selected (${currentBookSelectedCount} selected from ${currentBookName}, ${selectedByEmail.size} total additional addresses)`;
  renderSelectionPreview();
}

function renderAddressBooks() {
  const select = document.getElementById("sourceAddressBookSelect");
  while (select.firstChild) {
    select.removeChild(select.firstChild);
  }

  if (sourceAddressBooks.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No address books available";
    select.appendChild(option);
    select.disabled = true;
    return;
  }

  const byBookCount = getSelectionCountByBook();

  sourceAddressBooks.forEach((book) => {
    const option = document.createElement("option");
    option.value = book.id;
    const count = byBookCount.get(book.id) || 0;
    option.textContent = count > 0 ? `${book.name} (${count})` : book.name;
    select.appendChild(option);
  });

  if (selectedSourceAddressBookId) {
    select.value = selectedSourceAddressBookId;
  }

  select.disabled = false;
}

function onContactToggle(event) {
  const index = Number(event.target.value);
  if (!Number.isInteger(index) || !contacts[index]) {
    return;
  }

  const recipient = contacts[index];
  const key = normalizeEmail(recipient.address);
  if (!key) {
    return;
  }

  if (event.target.checked) {
    selectedByEmail.set(key, {
      name: recipient.name || recipient.address,
      address: recipient.address,
      sourceAddressBookId: selectedSourceAddressBookId,
    });
  } else {
    selectedByEmail.delete(key);
  }

  renderAddressBooks();
  updateSummary();
}

function renderContacts() {
  const container = document.getElementById("contactContainer");
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  if (contacts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No contacts found for this address book and filter.";
    container.appendChild(empty);
    const summary = document.getElementById("contactSummary");
    summary.textContent = `0 of 0 in this address book selected (${selectedByEmail.size} total additional addresses)`;
    renderSelectionPreview();
    return;
  }

  contacts.forEach((recipient, index) => {
    const row = document.createElement("label");
    row.className = "contact-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "contact-check";
    checkbox.value = String(index);
    checkbox.checked = selectedByEmail.has(normalizeEmail(recipient.address));
    checkbox.addEventListener("change", onContactToggle);

    const text = document.createElement("span");
    text.className = "contact-text";
    text.textContent = recipient.name
      ? `${recipient.name} <${recipient.address}>`
      : recipient.address;

    row.appendChild(checkbox);
    row.appendChild(text);
    container.appendChild(row);
  });

  updateSummary();
}

async function loadContacts() {
  if (!selectedSourceAddressBookId) {
    contacts = [];
    renderContacts();
    return;
  }

  const query = document.getElementById("contactSearchInput").value.trim();
  const response = await browser.runtime.sendMessage({
    type: "getAddressBookContacts",
    contextToken,
    addressBookId: selectedSourceAddressBookId,
    query,
  });

  if (!response || !response.ok) {
    throw new Error((response && response.error) || "Unable to load address-book contacts.");
  }

  contacts = Array.isArray(response.contacts) ? response.contacts : [];
  selectedSourceAddressBookId = String(response.selectedSourceAddressBookId || selectedSourceAddressBookId);
  renderContacts();
}

async function loadContext() {
  const response = await browser.runtime.sendMessage({
    type: "getAddressBookPickerContext",
    contextToken,
  });

  if (!response || !response.ok) {
    throw new Error((response && response.error) || "Unable to load address-book picker context.");
  }

  sourceAddressBooks = Array.isArray(response.sourceAddressBooks) ? response.sourceAddressBooks : [];
  selectedSourceAddressBookId = String(response.selectedSourceAddressBookId || "");

  const initiallySelected = Array.isArray(response.selectedAddressBookSelections)
    ? response.selectedAddressBookSelections
    : Array.isArray(response.selectedAddressBookRecipients)
      ? response.selectedAddressBookRecipients
    : [];
  selectedByEmail = new Map();
  initiallySelected.forEach((recipient) => {
    if (!recipient || !recipient.address) {
      return;
    }

    const key = normalizeEmail(recipient.address);
    if (key && !selectedByEmail.has(key)) {
      selectedByEmail.set(key, {
        name: recipient.name || recipient.address,
        address: recipient.address,
        sourceAddressBookId:
          typeof recipient.sourceAddressBookId === "string" && recipient.sourceAddressBookId
            ? recipient.sourceAddressBookId
            : selectedSourceAddressBookId,
      });
    }
  });

  if (!selectedSourceAddressBookId && sourceAddressBooks[0]) {
    selectedSourceAddressBookId = sourceAddressBooks[0].id;
  }
}

function setSaving(inProgress) {
  isSaving = inProgress;
  const addButton = document.getElementById("addSelectedButton");
  addButton.disabled = inProgress;
  addButton.textContent = inProgress ? "Adding..." : "Add Selected";
}

async function saveSelection() {
  if (isSaving) {
    return;
  }

  setSaving(true);
  setStatus("");

  try {
    const response = await browser.runtime.sendMessage({
      type: "saveAddressBookRecipients",
      contextToken,
      selectedSourceAddressBookId,
      recipients: Array.from(selectedByEmail.values()),
      recipientSelections: Array.from(selectedByEmail.values()),
    });

    if (!response || !response.ok) {
      throw new Error((response && response.error) || "Unable to save selected addresses.");
    }

    window.close();
  } catch (error) {
    setStatus(error.message || "Unable to save selected addresses.", true);
  } finally {
    setSaving(false);
  }
}

function removeSelectedInCurrentView() {
  let removedCount = 0;
  contacts.forEach((recipient, index) => {
    const input = document.querySelector(`.contact-check[value="${index}"]`);
    if (!input || !input.checked) {
      return;
    }

    const key = normalizeEmail(recipient.address);
    if (key && selectedByEmail.has(key)) {
      selectedByEmail.delete(key);
      removedCount += 1;
    }
  });

  renderAddressBooks();
  renderContacts();
  setStatus(removedCount > 0 ? `Removed ${removedCount} selection(s) from this view.` : "No checked contacts to remove.");
}

function clearAllSelections() {
  const removedCount = selectedByEmail.size;
  selectedByEmail = new Map();
  renderAddressBooks();
  renderContacts();
  setStatus(removedCount > 0 ? "Cleared all added address-book selections." : "No added selections to clear.");
}

function onSearchInput() {
  if (searchTimer) {
    window.clearTimeout(searchTimer);
  }

  searchTimer = window.setTimeout(() => {
    loadContacts().catch((error) => {
      setStatus(error.message || "Unable to load contacts.", true);
    });
  }, 250);
}

async function init() {
  document.getElementById("cancelButton").addEventListener("click", () => {
    window.close();
  });

  document.getElementById("addSelectedButton").addEventListener("click", () => {
    saveSelection().catch((error) => {
      setStatus(error.message || "Unable to save selected addresses.", true);
    });
  });

  document.getElementById("sourceAddressBookSelect").addEventListener("change", (event) => {
    selectedSourceAddressBookId = String(event.target.value || "");
    loadContacts().catch((error) => {
      setStatus(error.message || "Unable to load contacts.", true);
    });
  });

  document.getElementById("contactSearchInput").addEventListener("input", onSearchInput);
  document.getElementById("removeSelectedButton").addEventListener("click", removeSelectedInCurrentView);
  document.getElementById("clearAllButton").addEventListener("click", clearAllSelections);

  contextToken = parseContextToken();
  if (!contextToken) {
    setStatus("Missing creation context token.", true);
    document.getElementById("contactSummary").textContent = "No context available";
    return;
  }

  try {
    await loadContext();
    renderAddressBooks();
    await loadContacts();
    renderSelectionPreview();
  } catch (error) {
    setStatus(error.message || "Unable to initialize picker.", true);
    document.getElementById("contactSummary").textContent = "No context available";
  }
}

init();
