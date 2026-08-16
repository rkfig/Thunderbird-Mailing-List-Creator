/*
 * Mailing List Creator - Background Script
 *
 * Purpose:
 * Coordinates toolbar actions, selected-message recipient extraction,
 * mailing list creation, overwrite handling, and contact population.
 *
 * Author: Ryan Figgins
 * Author Email Address: mailing-list-creator@rkfig.com
 */

/* global browser */

// In-memory contexts tie popup windows to selected message data and user choices.
const pendingContexts = new Map();
const CONTEXT_TTL_MS = 10 * 60 * 1000;
const OPEN_FOR_REVIEW_SETTING_KEY = "openForReviewAfterCreate";

// Generates a short-lived token used to map popup interactions to one action context.
function generateContextToken() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Shows user-visible notifications for success/failure and guidance.
function notify(id, message) {
  return browser.notifications.create(id, {
    type: "basic",
    title: "Mailing List Creator",
    message,
  });
}

// Splits a mailbox header while preserving commas inside quoted names.
function splitMailboxHeader(headerValue) {
  const parts = [];
  let current = "";
  let inQuotes = false;

  for (const char of headerValue) {
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
      continue;
    }

    if (char === "," && !inQuotes) {
      const value = current.trim();
      if (value) {
        parts.push(value);
      }
      current = "";
      continue;
    }

    current += char;
  }

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

  for (const recipient of recipients) {
    if (!recipient || !recipient.address) {
      continue;
    }

    const key = recipient.address.toLowerCase();
    if (!byAddress.has(key)) {
      byAddress.set(key, {
        name: recipient.name || "",
        address: recipient.address,
      });
    }
  }

  return Array.from(byAddress.values());
}

// Clears stale popup contexts to avoid leaking in-memory state.
function prunePendingContexts() {
  const now = Date.now();
  for (const [contextToken, context] of pendingContexts.entries()) {
    if (!context || !context.createdAt || now - context.createdAt > CONTEXT_TTL_MS) {
      pendingContexts.delete(contextToken);
    }
  }
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

// Picks the first writable address book, falling back to the first available book.
function pickWritableAddressBook(addressBooks) {
  return addressBooks.find((book) => !book.readOnly) || addressBooks[0] || null;
}

// Lists mailing lists for one address book using modern or legacy APIs.
async function listMailingListsForBook(parentId, addressBooks) {
  if (browser.addressBooks && browser.addressBooks.mailingLists && browser.addressBooks.mailingLists.list) {
    const lists = await browser.addressBooks.mailingLists.list(parentId);
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
  for (const list of mailingLists) {
    const listName = String(list && list.name ? list.name : "").trim().toLowerCase();
    const listType = String(list && list.type ? list.type : "");
    if (listType && listType !== "mailingList") {
      continue;
    }

    if (listName === normalized) {
      return {
        id: list.id,
        name: list.name,
        parentId,
      };
    }
  }

  return null;
}

// Creates a mailing list using the most specific API exposed by this Thunderbird build.
async function createMailingList(parentId, listName) {
  if (browser.addressBooks && browser.addressBooks.mailingLists && browser.addressBooks.mailingLists.create) {
    const listId = await browser.addressBooks.mailingLists.create(parentId, {
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
  if (browser.addressBooks && browser.addressBooks.mailingLists && browser.addressBooks.mailingLists.delete) {
    await browser.addressBooks.mailingLists.delete(listId);
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

  const contactsApi = browser.addressBooks && browser.addressBooks.contacts;
  const mailingListsApi = browser.addressBooks && browser.addressBooks.mailingLists;

  if (contactsApi && contactsApi.create && mailingListsApi && mailingListsApi.get && mailingListsApi.addMember) {
    const listNode = await mailingListsApi.get(listId);
    if (!listNode || !listNode.parentId) {
      throw new Error("Unable to resolve mailing list parent address book.");
    }

    const vCard = `BEGIN:VCARD\nVERSION:4.0\nFN:${safeName}\nEMAIL:${safeEmail}\nEND:VCARD`;
    const contactId = await contactsApi.create(listNode.parentId, vCard);
    await mailingListsApi.addMember(listId, contactId);
    return;
  }

  if (browser.contacts && browser.contacts.create && browser.mailingLists && browser.mailingLists.addMember) {
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
  if (browser.addressBooks && browser.addressBooks.mailingLists && browser.addressBooks.mailingLists.get) {
    try {
      const list = await browser.addressBooks.mailingLists.get(listId);
      return Boolean(list && list.id);
    } catch (_error) {
      return false;
    }
  }

  const books = await listAddressBooks();
  for (const book of books) {
    const mailingLists = Array.isArray(book.mailingLists) ? book.mailingLists : [];
    if (mailingLists.some((item) => item.id === listId)) {
      return true;
    }
  }

  return false;
}

// During active development, optionally open or notify for post-create review.
async function openListForReviewIfSupported(createdList) {
  const settings = await browser.storage.local.get(OPEN_FOR_REVIEW_SETTING_KEY);
  if (settings[OPEN_FOR_REVIEW_SETTING_KEY] === false) {
    return;
  }

  if (browser.addressBooks.openUI) {
    try {
      await browser.addressBooks.openUI(createdList.id);
      return;
    } catch (_openError) {
      await notify(
        "mailing-list-open-review",
        `Mailing list \"${createdList.name}\" created. Open it in Address Book to review.`
      );
      return;
    }
  }

  await notify(
    "mailing-list-open-review",
    `Mailing list \"${createdList.name}\" created. Open it in Address Book to review.`
  );
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

    if (messages.length === 0 && browser.messageDisplay && browser.messageDisplay.getDisplayedMessage) {
      const displayedMessage = await browser.messageDisplay.getDisplayedMessage(tab.id);
      if (displayedMessage && displayedMessage.id) {
        messages.push(displayedMessage);
      }
    }

    const uniqueById = new Map();
    for (const message of messages) {
      if (message && message.id && !uniqueById.has(message.id)) {
        uniqueById.set(message.id, message);
      }
    }

    return Array.from(uniqueById.values());
  } catch (_error) {
    return [];
  }
}

// Aggregates To/CC recipients across all selected messages.
async function extractRecipients(messages) {
  const parsed = [];
  for (const message of messages) {
    if (!message || !message.id) {
      continue;
    }

    const fullMessage = await browser.messages.getFull(message.id);
    const headers = fullMessage && fullMessage.headers ? fullMessage.headers : {};
    const toHeaders = Array.isArray(headers.to) ? headers.to : [];
    const ccHeaders = Array.isArray(headers.cc) ? headers.cc : [];

    for (const header of [...toHeaders, ...ccHeaders]) {
      const entries = splitMailboxHeader(String(header));
      for (const entry of entries) {
        const recipient = parseAddressEntry(entry);
        if (recipient) {
          parsed.push(recipient);
        }
      }
    }
  }

  return normalizeUniqueRecipients(parsed);
}

// Entry point for toolbar button clicks.
async function onToolbarClicked() {
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
    const contextToken = generateContextToken();
    pendingContexts.set(contextToken, {
      messageIds: selectedMessages.map((message) => message.id),
      recipients,
      selectedRecipients: [],
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
    await notify("mailing-list-error", `Unable to open Mailing List window: ${error.message || String(error)}`);
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
  const targetBook = pickWritableAddressBook(books);
  if (!targetBook || !targetBook.id) {
    return {
      ok: false,
      code: "NO_ADDRESS_BOOK",
      message: "Error Creating Mailing List: No writable address book found.",
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

  for (const recipient of selectedRecipients) {
    await addContactToList(createdList.id, recipient);
  }

  context.selectedRecipients = selectedRecipients;
  pendingContexts.set(contextToken, context);

  await openListForReviewIfSupported(createdList);

  return {
    ok: true,
    listId: createdList.id,
    listName: createdList.name,
    recipientCount: selectedRecipients.length,
  };
}

// Ensures popup context is removed if user closes the popup window.
browser.windows.onRemoved.addListener((windowId) => {
  for (const [contextToken, context] of pendingContexts.entries()) {
    if (context.windowId === windowId) {
      pendingContexts.delete(contextToken);
    }
  }
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

  return undefined;
});

// Register toolbar click handler.
browser.browserAction.onClicked.addListener(onToolbarClicked);
