/*
 * Add-on: Mailing List Creator
 * Repository: https://github.com/rkfig/Thunderbird-Mailing-List-Creator.git
 * File: src/background/main.js
 * Manifest Version: 2
 * Header Data Scope: Incoming message headers (Reply-To/From/To/CC/BCC) via messagesRead
 * Permission Basis: messagesRead, addressBooks, notifications, menus, storage
 * Compose Permission Note: compose is not required for this incoming-header workflow
 * Purpose: Coordinates toolbar actions, selected-message recipient extraction,
 *          mailing list creation, overwrite handling, and contact population.
 * Author: Ryan Figgins
 * Author Email Address: 14152271+rkfig@users.noreply.github.com
 */

/* global browser */

// In-memory contexts tie popup windows to selected message data and user choices.
const pendingContexts = new Map();
const CONTEXT_TTL_MS = 10 * 60 * 1000;
const TOOLS_MENU_ITEM_ID = "mailing-list-creator-tools-menu";
const ENTRY_POINT_SETTINGS_KEY = "entryPointSettings";
const DEFAULT_ENTRY_POINT_SETTINGS = Object.freeze({
  showToolbarButton: true,
  showToolsMenuItem: false,
});

let toolsMenuRegistered = false;

function normalizeEntryPointSettings(rawSettings) {
  const source = rawSettings && typeof rawSettings === "object" ? rawSettings : {};
  const normalized = {
    showToolbarButton:
      typeof source.showToolbarButton === "boolean"
        ? source.showToolbarButton
        : DEFAULT_ENTRY_POINT_SETTINGS.showToolbarButton,
    showToolsMenuItem:
      typeof source.showToolsMenuItem === "boolean"
        ? source.showToolsMenuItem
        : DEFAULT_ENTRY_POINT_SETTINGS.showToolsMenuItem,
  };

  if (!normalized.showToolbarButton && !normalized.showToolsMenuItem) {
    normalized.showToolbarButton = true;
  }

  return normalized;
}

async function getEntryPointSettings() {
  if (!browser.storage || !browser.storage.local) {
    return { ...DEFAULT_ENTRY_POINT_SETTINGS };
  }

  try {
    const stored = await browser.storage.local.get(ENTRY_POINT_SETTINGS_KEY);
    return normalizeEntryPointSettings(stored[ENTRY_POINT_SETTINGS_KEY]);
  } catch (_error) {
    return { ...DEFAULT_ENTRY_POINT_SETTINGS };
  }
}

async function setToolbarButtonEnabled(enabled) {
  if (!browser.browserAction) {
    return;
  }

  if (enabled && browser.browserAction.enable) {
    await browser.browserAction.enable();
    if (browser.browserAction.setTitle) {
      await browser.browserAction.setTitle({ title: "Mailing List" });
    }
    return;
  }

  if (!enabled && browser.browserAction.disable) {
    await browser.browserAction.disable();
    if (browser.browserAction.setBadgeText) {
      await browser.browserAction.setBadgeText({ text: "" });
    }
    if (browser.browserAction.setTitle) {
      await browser.browserAction.setTitle({
        title: "Mailing List (toolbar button disabled in add-on settings)",
      });
    }
  }
}

async function syncToolsMenuItem(showToolsMenuItem) {
  if (!browser.menus || !browser.menus.create) {
    return false;
  }

  if (showToolsMenuItem) {
    if (toolsMenuRegistered) {
      return true;
    }

    try {
      browser.menus.create({
        id: TOOLS_MENU_ITEM_ID,
        title: "Mailing List",
        contexts: ["tools_menu"],
      });
      toolsMenuRegistered = true;
    } catch (_error) {
      toolsMenuRegistered = false;
      return false;
    }
    return true;
  }

  if (!toolsMenuRegistered || !browser.menus.remove) {
    return false;
  }

  try {
    await browser.menus.remove(TOOLS_MENU_ITEM_ID);
  } catch (_error) {
    // Ignore remove failures; the item may not exist in older Thunderbird builds.
  } finally {
    toolsMenuRegistered = false;
  }

  return false;
}

async function applyEntryPointSettings(rawSettings) {
  const requested = normalizeEntryPointSettings(rawSettings);
  const effective = {
    ...requested,
    showToolsMenuItem: await syncToolsMenuItem(requested.showToolsMenuItem),
  };

  if (!effective.showToolbarButton && !effective.showToolsMenuItem) {
    effective.showToolbarButton = true;
  }

  await setToolbarButtonEnabled(effective.showToolbarButton);
  return effective;
}

async function saveEntryPointSettings(rawSettings) {
  const settings = await applyEntryPointSettings(rawSettings);

  if (browser.storage && browser.storage.local && browser.storage.local.set) {
    await browser.storage.local.set({
      [ENTRY_POINT_SETTINGS_KEY]: settings,
    });
  }

  return settings;
}

// Generates a short-lived token used to map popup interactions to one action context.
function generateContextToken() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Shows user-visible notifications for success/failure and guidance.
async function notify(id, message) {
  if (browser.notifications && browser.notifications.create) {
    try {
      await browser.notifications.create(id, {
        type: "basic",
        title: "Mailing List Creator",
        message,
      });
      return;
    } catch (_error) {
      // Fall through to badge/title feedback when notifications are unavailable.
    }
  }

  if (browser.browserAction && browser.browserAction.setBadgeText) {
    await browser.browserAction.setBadgeBackgroundColor({ color: "#b3261e" });
    await browser.browserAction.setBadgeText({ text: "!" });
    await browser.browserAction.setTitle({ title: `Mailing List Creator: ${message}` });
  }
}

// Splits a mailbox header while preserving commas inside quoted names.
function splitMailboxHeader(headerValue) {
  const parts = [];
  let current = "";
  let inQuotes = false;

  String(headerValue || "").split("").forEach((char) => {
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
      return;
    }

    if (char === "," && !inQuotes) {
      const value = current.trim();
      if (value) {
        parts.push(value);
      }
      current = "";
      return;
    }

    current += char;
  });

  const tail = current.trim();
  if (tail) {
    parts.push(tail);
  }

  return parts;
}

// Converts a raw recipient string into a normalized object.
function parseAddressEntry(entry) {
  const angleMatch = entry.match(/^(.*)<([^>]+)>$/);
  if (angleMatch) {
    const name = angleMatch[1].trim().replace(/^"|"$/g, "");
    const address = angleMatch[2].trim();
    if (!address.includes("@")) {
      return null;
    }
    return { name, address };
  }

  const raw = entry.trim().replace(/^"|"$/g, "");
  if (!raw.includes("@")) {
    return null;
  }

  return { name: "", address: raw };
}

// Deduplicates recipients by normalized email address.
function normalizeUniqueRecipients(recipients) {
  const byAddress = new Map();

  recipients.forEach((recipient) => {
    if (!recipient || !recipient.address) {
      return;
    }

    const key = recipient.address.toLowerCase();
    if (!byAddress.has(key)) {
      byAddress.set(key, {
        name: recipient.name || "",
        address: recipient.address,
      });
    }
  });

  return Array.from(byAddress.values());
}

// Clears stale popup contexts to avoid leaking in-memory state.
function prunePendingContexts() {
  const now = Date.now();
  pendingContexts.forEach((context, contextToken) => {
    if (!context || !context.createdAt || now - context.createdAt > CONTEXT_TTL_MS) {
      pendingContexts.delete(contextToken);
    }
  });
}

// Accepts only recipients that were part of the originally collected context.
function filterRecipientsAgainstContext(contextRecipients, selectedRecipients) {
  const allowed = new Set(
    normalizeUniqueRecipients(contextRecipients).map((recipient) => recipient.address.toLowerCase())
  );

  const normalized = normalizeUniqueRecipients(selectedRecipients);
  return normalized.filter((recipient) => allowed.has(recipient.address.toLowerCase()));
}

// Enforces naming rules and returns user-facing validation messages.
function validateListName(rawName) {
  try {
    const trimmed = String(rawName || "").trim();
    if (!trimmed) {
      return { ok: false, code: "NO_NAME", message: "No Mailing List Name entered" };
    }

    if (/[\u0000-\u001f\u007f]/.test(trimmed)) {
      return {
        ok: false,
        code: "PARSE_ERROR",
        message: "Error Parsing Mailing List Name Please Try Another Name",
      };
    }

    const forbiddenMatch = trimmed.match(/[^a-zA-Z0-9 _\-.]/);
    if (forbiddenMatch) {
      return {
        ok: false,
        code: "SPECIAL_CHAR",
        message: `Special Character Not Allowed: ${forbiddenMatch[0]}`,
      };
    }

    if (trimmed.length > 120) {
      return { ok: false, code: "NAME_TOO_LONG", message: "Mailing List Name is too long" };
    }

    return { ok: true, name: trimmed };
  } catch (_error) {
    return {
      ok: false,
      code: "PARSE_ERROR",
      message: "Error Parsing Mailing List Name Please Try Another Name",
    };
  }
}

// Reads address books with compatibility fallback for differing API shapes.
async function listAddressBooks() {
  try {
    const books = await browser.addressBooks.list(true);
    return Array.isArray(books) ? books : [];
  } catch (_error) {
    const books = await browser.addressBooks.list();
    return Array.isArray(books) ? books : [];
  }
}

// Picks the first writable address book.
function pickWritableAddressBook(addressBooks) {
  return addressBooks.find((book) => book && book.id && !book.readOnly) || null;
}

// Reduces address books to popup-safe option objects and keeps writable books only.
function toAddressBookOptions(addressBooks) {
  return addressBooks
    .filter((book) => book && book.id && !book.readOnly)
    .map((book) => ({
      id: book.id,
      name: String(book.name || "Unnamed Address Book"),
    }));
}

// Lists mailing lists for one address book using modern or legacy APIs.
async function listMailingListsForBook(parentId, addressBooks) {
  const addressBooksApi = browser.addressBooks;
  const mailingListsApi = addressBooksApi && addressBooksApi.mailingLists;

  if (mailingListsApi && mailingListsApi.list) {
    const lists = await mailingListsApi.list(parentId);
    return Array.isArray(lists) ? lists : [];
  }

  if (browser.mailingLists && browser.mailingLists.list) {
    try {
      const lists = await browser.mailingLists.list(parentId);
      return Array.isArray(lists) ? lists : [];
    } catch (_firstError) {
      const lists = await browser.mailingLists.list();
      const allLists = Array.isArray(lists) ? lists : [];
      return allLists.filter((list) => list && list.parentId === parentId);
    }
  }

  const book = addressBooks.find((candidate) => candidate.id === parentId);
  const lists = book && Array.isArray(book.mailingLists) ? book.mailingLists : [];
  return lists;
}

// Finds an existing list by exact case-insensitive name in the target address book.
async function findMailingListByName(parentId, addressBooks, desiredName) {
  const normalized = String(desiredName || "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const mailingLists = await listMailingListsForBook(parentId, addressBooks);
  const match = mailingLists.find((list) => {
    const listName = String(list && list.name ? list.name : "").trim().toLowerCase();
    const listType = String(list && list.type ? list.type : "");
    return (!listType || listType === "mailingList") && listName === normalized;
  });

  if (!match) {
    return null;
  }

  return {
    id: match.id,
    name: match.name,
    parentId,
  };
}

// Creates a mailing list using the most specific API exposed by this Thunderbird build.
async function createMailingList(parentId, listName) {
  const addressBooksApi = browser.addressBooks;
  const mailingListsApi = addressBooksApi && addressBooksApi.mailingLists;

  if (mailingListsApi && mailingListsApi.create) {
    const listId = await mailingListsApi.create(parentId, {
      name: listName,
    });
    return {
      id: listId,
      name: listName,
      parentId,
    };
  }

  if (browser.mailingLists && browser.mailingLists.create) {
    const created = await browser.mailingLists.create(parentId, { name: listName });
    if (created && created.id) {
      return created;
    }
    return {
      id: created,
      name: listName,
      parentId,
    };
  }

  throw new Error("Mailing list create API is unavailable in this Thunderbird build.");
}

// Deletes an existing mailing list when overwrite is confirmed.
async function deleteExistingMailingList(listId) {
  const addressBooksApi = browser.addressBooks;
  const mailingListsApi = addressBooksApi && addressBooksApi.mailingLists;

  if (mailingListsApi && mailingListsApi.delete) {
    await mailingListsApi.delete(listId);
    return;
  }

  if (browser.mailingLists && browser.mailingLists.delete) {
    await browser.mailingLists.delete(listId);
    return;
  }

  throw new Error("This Thunderbird build does not expose a mailing-list delete API.");
}

// Adds one recipient to a list through modern or legacy contact/list APIs.
async function addContactToList(listId, recipient) {
  if (!recipient || !recipient.address) {
    return;
  }

  const safeName = String(recipient.name || recipient.address)
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
  const safeEmail = String(recipient.address).trim();

  const addressBooksApi = browser.addressBooks;
  const contactsApi = addressBooksApi && addressBooksApi.contacts;
  const mailingListsApi = addressBooksApi && addressBooksApi.mailingLists;

  if (
    contactsApi &&
    contactsApi.create &&
    mailingListsApi &&
    mailingListsApi.get &&
    mailingListsApi.addMember
  ) {
    const listNode = await mailingListsApi.get(listId);
    if (!listNode || !listNode.parentId) {
      throw new Error("Unable to resolve mailing list parent address book.");
    }

    const vCard = `BEGIN:VCARD\nVERSION:4.0\nFN:${safeName}\nEMAIL:${safeEmail}\nEND:VCARD`;
    const contactId = await contactsApi.create(listNode.parentId, vCard);
    await mailingListsApi.addMember(listId, contactId);
    return;
  }

  if (
    browser.contacts &&
    browser.contacts.create &&
    browser.mailingLists &&
    browser.mailingLists.addMember
  ) {
    let parentId = null;
    if (browser.mailingLists.get) {
      const listNode = await browser.mailingLists.get(listId);
      parentId = listNode && listNode.parentId ? listNode.parentId : null;
    }

    if (!parentId) {
      throw new Error("Unable to resolve mailing list parent address book.");
    }

    let createdContact = null;
    try {
      createdContact = await browser.contacts.create(parentId, {
        DisplayName: recipient.name || recipient.address,
        PrimaryEmail: safeEmail,
      });
    } catch (_firstError) {
      createdContact = await browser.contacts.create({
        parentId,
        DisplayName: recipient.name || recipient.address,
        PrimaryEmail: safeEmail,
      });
    }

    const contactId = createdContact && createdContact.id ? createdContact.id : createdContact;
    await browser.mailingLists.addMember(listId, contactId);
    return;
  }

  if (browser.addressBooks && browser.addressBooks.addContact) {
    await browser.addressBooks.addContact(listId, {
      displayName: recipient.name || recipient.address,
      primaryEmail: safeEmail,
    });
    return;
  }

  throw new Error("Contact create/member-add API is unavailable in this Thunderbird build.");
}

// Verifies list creation by querying either direct list APIs or address book trees.
async function verifyListCreated(listId) {
  const addressBooksApi = browser.addressBooks;
  const mailingListsApi = addressBooksApi && addressBooksApi.mailingLists;

  if (mailingListsApi && mailingListsApi.get) {
    try {
      const list = await mailingListsApi.get(listId);
      return Boolean(list && list.id);
    } catch (_error) {
      return false;
    }
  }

  const books = await listAddressBooks();
  return books.some((book) => {
    const mailingLists = Array.isArray(book.mailingLists) ? book.mailingLists : [];
    return mailingLists.some((item) => item.id === listId);
  });
}

// Checks whether any selected/displated message context is available.
async function hasDisplayedMessage() {
  const messages = await getSelectedOrDisplayedMessages();
  return messages.length > 0;
}

// Collects selected messages first, then falls back to the displayed message.
async function getSelectedOrDisplayedMessages() {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab || !tab.id) {
      return [];
    }

    const messages = [];

    if (browser.mailTabs && browser.mailTabs.getSelectedMessages) {
      try {
        let messageList = await browser.mailTabs.getSelectedMessages(tab.id);
        while (messageList) {
          if (Array.isArray(messageList.messages)) {
            messages.push(...messageList.messages);
          }

          if (!messageList.id || !browser.messages || !browser.messages.continueList) {
            break;
          }

          messageList = await browser.messages.continueList(messageList.id);
        }
      } catch (_selectionError) {
        // Fall back to displayed message path.
      }
    }

    if (
      messages.length === 0 &&
      browser.messageDisplay &&
      browser.messageDisplay.getDisplayedMessage
    ) {
      const displayedMessage = await browser.messageDisplay.getDisplayedMessage(tab.id);
      if (displayedMessage && displayedMessage.id) {
        messages.push(displayedMessage);
      }
    }

    const uniqueById = new Map();
    messages.forEach((message) => {
      if (message && message.id && !uniqueById.has(message.id)) {
        uniqueById.set(message.id, message);
      }
    });

    return Array.from(uniqueById.values());
  } catch (_error) {
    return [];
  }
}

// Aggregates Reply-To/From/To/CC/BCC addresses across all selected messages.
async function extractRecipients(messages) {
  const expanded = [];
  const fullMessages = await Promise.all(
    messages
      .filter((message) => message && message.id)
      .map((message) => browser.messages.getFull(message.id))
  );

  fullMessages.forEach((fullMessage) => {
    const headers = fullMessage && fullMessage.headers ? fullMessage.headers : {};
    const replyToHeaders = Array.isArray(headers["reply-to"]) ? headers["reply-to"] : [];
    const fromHeaders = Array.isArray(headers.from) ? headers.from : [];
    const toHeaders = Array.isArray(headers.to) ? headers.to : [];
    const ccHeaders = Array.isArray(headers.cc) ? headers.cc : [];
    const bccHeaders = Array.isArray(headers.bcc) ? headers.bcc : [];

    [...replyToHeaders, ...fromHeaders, ...toHeaders, ...ccHeaders, ...bccHeaders].forEach((header) => {
      const entries = splitMailboxHeader(String(header));
      entries.forEach((entry) => {
        const recipient = parseAddressEntry(entry);
        if (recipient) {
          expanded.push(recipient);
        }
      });
    });
  });

  return normalizeUniqueRecipients(expanded);
}

// Entry point shared by the toolbar button and the Tools menu item.
async function launchMailingListCreator() {
  try {
    prunePendingContexts();

    const selected = await hasDisplayedMessage();
    if (!selected) {
      await notify("no-selected-email", "Select an email first to create a mailing list.");
      return;
    }

    const selectedMessages = await getSelectedOrDisplayedMessages();
    if (selectedMessages.length === 0) {
      await notify("no-selected-email", "Select an email first to create a mailing list.");
      return;
    }

    const recipients = await extractRecipients(selectedMessages);
    const books = await listAddressBooks();
    const addressBookOptions = toAddressBookOptions(books);
    if (addressBookOptions.length === 0) {
      await notify("no-writable-address-book", "No writable address book is available.");
      return;
    }

    const contextToken = generateContextToken();
    pendingContexts.set(contextToken, {
      messageIds: selectedMessages.map((message) => message.id),
      recipients,
      selectedRecipients: [],
      addressBookOptions,
      selectedAddressBookId: addressBookOptions[0].id,
      createdAt: Date.now(),
      windowId: null,
    });

    const popupWindow = await browser.windows.create({
      type: "popup",
      url: `src/ui/recipient-dialog/index.html?contextToken=${encodeURIComponent(contextToken)}`,
      width: 760,
      height: 620,
    });

    const context = pendingContexts.get(contextToken);
    if (context) {
      context.windowId = popupWindow.id || null;
      pendingContexts.set(contextToken, context);
    }
  } catch (error) {
    await notify(
      "mailing-list-error",
      `Unable to open Mailing List window: ${error.message || String(error)}`
    );
  }
}

// Handles validation, overwrite checks, create/verify, and recipient insertion.
async function createMailingListFromSelection(request) {
  prunePendingContexts();

  const contextToken = String(request.contextToken || "");
  const context = pendingContexts.get(contextToken);
  if (!context) {
    return { ok: false, code: "NO_CONTEXT", message: "Context unavailable." };
  }

  const validation = validateListName(request.listName);
  if (!validation.ok) {
    return validation;
  }

  const incomingSelectedRecipients = Array.isArray(request.selectedRecipients)
    ? request.selectedRecipients
    : [];
  const selectedRecipients = filterRecipientsAgainstContext(
    context.recipients,
    incomingSelectedRecipients
  );

  const books = await listAddressBooks();
  const requestedAddressBookId = String(request.addressBookId || "");
  const targetBook = requestedAddressBookId
    ? books.find((book) => book && book.id === requestedAddressBookId && !book.readOnly) || null
    : pickWritableAddressBook(books);

  if (!targetBook || !targetBook.id) {
    return {
      ok: false,
      code: "NO_ADDRESS_BOOK",
      message: "Error Creating Mailing List: Selected address book is not writable or unavailable.",
    };
  }

  const existing = await findMailingListByName(targetBook.id, books, validation.name);
  const overwriteExisting = Boolean(request.overwriteExisting);
  if (existing && !overwriteExisting) {
    return {
      ok: false,
      code: "LIST_EXISTS",
      message: "A list with that name already exists. Do you want to overwrite it?",
    };
  }

  if (existing && overwriteExisting) {
    await deleteExistingMailingList(existing.id);
  }

  const targetParentId = existing ? existing.parentId : targetBook.id;
  const createdList = await createMailingList(targetParentId, validation.name);

  if (!createdList || !createdList.id) {
    return {
      ok: false,
      code: "CREATE_FAILED",
      message: "Error Creating Mailing List",
      details: "API did not return a created list identifier.",
    };
  }

  const created = await verifyListCreated(createdList.id);
  if (!created) {
    return {
      ok: false,
      code: "VERIFY_FAILED",
      message: "Error Creating Mailing List",
      details: "Verification failed after list creation.",
    };
  }

  await Promise.all(
    selectedRecipients.map((recipient) => addContactToList(createdList.id, recipient))
  );

  context.selectedRecipients = selectedRecipients;
  context.selectedAddressBookId = targetBook.id;
  pendingContexts.set(contextToken, context);

  await notify(
    `mailing-list-created-${createdList.id}`,
    `Created "${createdList.name}" with ${selectedRecipients.length} recipients.`
  );

  return {
    ok: true,
    listId: createdList.id,
    listName: createdList.name,
    recipientCount: selectedRecipients.length,
  };
}

// Ensures popup context is removed if user closes the popup window.
browser.windows.onRemoved.addListener((windowId) => {
  pendingContexts.forEach((context, contextToken) => {
    if (context.windowId === windowId) {
      pendingContexts.delete(contextToken);
    }
  });
});

// Runtime message router for popup -> background requests.
browser.runtime.onMessage.addListener((message) => {
  if (!message || !message.type) {
    return undefined;
  }

  if (message.type === "getRecipientContext") {
    const contextToken = String(message.contextToken || "");
    const context = pendingContexts.get(contextToken);
    if (!context) {
      return Promise.resolve({ ok: false, error: "Context unavailable." });
    }

    return Promise.resolve({
      ok: true,
      recipients: context.recipients,
      selectedCount: context.selectedRecipients.length,
      addressBooks: context.addressBookOptions || [],
      selectedAddressBookId: context.selectedAddressBookId || "",
    });
  }

  if (message.type === "saveRecipientSelection") {
    const contextToken = String(message.contextToken || "");
    const context = pendingContexts.get(contextToken);
    if (!context) {
      return Promise.resolve({ ok: false, error: "Context unavailable." });
    }

    context.selectedRecipients = Array.isArray(message.selectedRecipients)
      ? message.selectedRecipients
      : [];
    pendingContexts.set(contextToken, context);

    return Promise.resolve({ ok: true });
  }

  if (message.type === "createMailingList") {
    return createMailingListFromSelection(message)
      .then((response) => response)
      .catch((error) => ({
        ok: false,
        code: "UNEXPECTED",
        message: "Error Creating Mailing List",
        details: error && error.message ? error.message : String(error),
      }));
  }

  if (message.type === "getEntryPointSettings") {
    return getEntryPointSettings().then((settings) => ({ ok: true, settings }));
  }

  if (message.type === "saveEntryPointSettings") {
    return saveEntryPointSettings(message.settings)
      .then((settings) => ({ ok: true, settings }))
      .catch((error) => ({
        ok: false,
        error: error && error.message ? error.message : String(error),
      }));
  }

  return undefined;
});

browser.menus.onClicked.addListener((info) => {
  if (info && info.menuItemId === TOOLS_MENU_ITEM_ID) {
    launchMailingListCreator().catch(() => undefined);
  }
});

if (browser.storage && browser.storage.onChanged) {
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[ENTRY_POINT_SETTINGS_KEY]) {
      return;
    }

    applyEntryPointSettings(changes[ENTRY_POINT_SETTINGS_KEY].newValue).catch(() => undefined);
  });
}

// Register toolbar click handler.
browser.browserAction.onClicked.addListener(launchMailingListCreator);

getEntryPointSettings()
  .then((settings) => applyEntryPointSettings(settings))
  .catch(() => undefined);
