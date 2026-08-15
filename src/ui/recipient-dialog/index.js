/* global browser, window, document */

let contextToken = "";
let recipients = [];

function parseContextToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get("contextToken") || "";
}

function updateSummary() {
  const checked = document.querySelectorAll(".recipient-check:checked").length;
  const summary = document.getElementById("recipientSummary");
  summary.textContent = `${checked} of ${recipients.length} recipients selected`;
}

function setStatus(message) {
  document.getElementById("statusMessage").textContent = message;
}

function renderRecipients() {
  const container = document.getElementById("recipientContainer");
  container.innerHTML = "";

  if (recipients.length === 0) {
    container.innerHTML = '<p class="empty">No To/CC addresses were found in the selected email.</p>';
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
}

async function onCreateClicked() {
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
    return;
  }

  setStatus(`Created \"${response.listName}\" with ${response.recipientCount} recipients.`);
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
