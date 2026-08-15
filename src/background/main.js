/* global browser */

const pendingContexts = new Map();
const CONTEXT_TTL_MS = 10 * 60 * 1000;
const OPEN_FOR_REVIEW_SETTING_KEY = "openForReviewAfterCreate";

function generateContextToken() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function notify(id, message) {
  return browser.notifications.create(id, {
    type: "basic",
    title: "Mailing List Creator",
    message,
  });
}

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

function prunePendingContexts() {
  const now = Date.now();
  for (const [contextToken, context] of pendingContexts.entries()) {
    if (!context || !context.createdAt || now - context.createdAt > CONTEXT_TTL_MS) {
      pendingContexts.delete(contextToken);
    }
  }
}

function filterRecipientsAgainstContext(contextRecipients, selectedRecipients) {
  const allowed = new Set(
    normalizeUniqueRecipients(contextRecipients).map((recipient) => recipient.address.toLowerCase())
  );

  const normalized = normalizeUniqueRecipients(selectedRecipients);
  return normalized.filter((recipient) => allowed.has(recipient.address.toLowerCase()));
}

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

async function listAddressBooks() {
  try {
    const books = await browser.addressBooks.list(true);
    return Array.isArray(books) ? books : [];
  } catch (_error) {
    const books = await browser.addressBooks.list();
    return Array.isArray(books) ? books : [];
  }
}

function pickWritableAddressBook(addressBooks) {
  return addressBooks.find((book) => !book.readOnly) || addressBooks[0] || null;
}

function findMailingListByName(addressBooks, desiredName) {
  const normalized = desiredName.toLowerCase();

  for (const book of addressBooks) {
    const mailingLists = Array.isArray(book.mailingLists) ? book.mailingLists : [];
    for (const list of mailingLists) {
      const listName = String(list.name || "").toLowerCase();
      if (listName === normalized) {
        return {
          id: list.id,
          name: list.name,
          parentId: book.id,
        };
      }
    }
  }

  return null;
}

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

  if (browser.addressBooks && browser.addressBooks.addContact) {
    await browser.addressBooks.addContact(listId, {
      displayName: recipient.name || recipient.address,
      primaryEmail: safeEmail,
    });
    return;
  }

  throw new Error("Contact create/member-add API is unavailable in this Thunderbird build.");
}

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

async function hasDisplayedMessage() {
  const message = await getDisplayedMessage();
  return Boolean(message && message.id);
}

async function getDisplayedMessage() {
  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (!tab || !tab.id) {
      return null;
    }

    return await browser.messageDisplay.getDisplayedMessage(tab.id);
  } catch (_error) {
    return null;
  }
}

async function extractRecipients(messageId) {
  const fullMessage = await browser.messages.getFull(messageId);
  const headers = fullMessage && fullMessage.headers ? fullMessage.headers : {};
  const toHeaders = Array.isArray(headers.to) ? headers.to : [];
  const ccHeaders = Array.isArray(headers.cc) ? headers.cc : [];

  const parsed = [];
  for (const header of [...toHeaders, ...ccHeaders]) {
    const entries = splitMailboxHeader(String(header));
    for (const entry of entries) {
      const recipient = parseAddressEntry(entry);
      if (recipient) {
        parsed.push(recipient);
      }
    }
  }

  return normalizeUniqueRecipients(parsed);
}

async function onToolbarClicked() {
  try {
    prunePendingContexts();

    const selected = await hasDisplayedMessage();
    if (!selected) {
      await notify("no-selected-email", "Select an email first to create a mailing list.");
      return;
    }

    const message = await getDisplayedMessage();
    if (!message || !message.id) {
      await notify("no-selected-email", "Select an email first to create a mailing list.");
      return;
    }

    const recipients = await extractRecipients(message.id);
    const contextToken = generateContextToken();
    pendingContexts.set(contextToken, {
      messageId: message.id,
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

  const existing = findMailingListByName(books, validation.name);
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

browser.windows.onRemoved.addListener((windowId) => {
  for (const [contextToken, context] of pendingContexts.entries()) {
    if (context.windowId === windowId) {
      pendingContexts.delete(contextToken);
    }
  }
});

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

browser.browserAction.onClicked.addListener(onToolbarClicked);
