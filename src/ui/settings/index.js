/*
 * Add-on: Mailing List Creator
 * Repository: https://github.com/rkfig/Thunderbird-Mailing-List-Creator.git
 * File: src/ui/settings/index.js
 * Manifest Version: 2
 * Header Data Scope: Launch entry-point preference messaging
 * Permission Basis: storage (saved settings), menus (Tools menu entry)
 * Purpose: Loads, validates, and saves add-on launch-entry settings.
 * Author: Ryan Figgins
 * Author Email Address: 14152271+rkfig@users.noreply.github.com
 */

/* global browser, document */

const form = document.getElementById("settingsForm");
const saveButton = document.getElementById("saveButton");
const statusMessage = document.getElementById("statusMessage");
const showToolbarButton = document.getElementById("showToolbarButton");
const showToolsMenuItem = document.getElementById("showToolsMenuItem");
const rulesEnabled = document.getElementById("rulesEnabled");
const includeDomainsInput = document.getElementById("includeDomainsInput");
const excludeDomainsInput = document.getElementById("excludeDomainsInput");
const excludeAddressesInput = document.getElementById("excludeAddressesInput");
const excludePrefixesInput = document.getElementById("excludePrefixesInput");
const postActionOpenCreatedList = document.getElementById("postActionOpenCreatedList");
const postActionKeepDialogOpen = document.getElementById("postActionKeepDialogOpen");
const postActionCopySummary = document.getElementById("postActionCopySummary");
const presetSelect = document.getElementById("presetSelect");
const applyPresetButton = document.getElementById("applyPresetButton");
const createPresetButton = document.getElementById("createPresetButton");
const renamePresetButton = document.getElementById("renamePresetButton");
const deletePresetButton = document.getElementById("deletePresetButton");

let recipientPresets = [];
let activePresetId = "";

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? "#b3261e" : "#1c5f57";
}

// Prevents repeat saves while the options page is persisting settings.
function setSaving(inProgress) {
  saveButton.disabled = inProgress;
  saveButton.textContent = inProgress ? "Saving..." : "Save Settings";
}

function splitCsvInput(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => Boolean(item));
}

function joinCsvValues(values) {
  return (Array.isArray(values) ? values : []).join(", ");
}

function readRuleSettingsFromForm() {
  return {
    enabled: Boolean(rulesEnabled.checked),
    includeDomains: splitCsvInput(includeDomainsInput.value),
    excludeDomains: splitCsvInput(excludeDomainsInput.value),
    excludeAddresses: splitCsvInput(excludeAddressesInput.value),
    excludePrefixes: splitCsvInput(excludePrefixesInput.value),
  };
}

function applyRuleSettingsToForm(rawSettings) {
  const settings = rawSettings && typeof rawSettings === "object" ? rawSettings : {};
  rulesEnabled.checked = Boolean(settings.enabled);
  includeDomainsInput.value = joinCsvValues(settings.includeDomains);
  excludeDomainsInput.value = joinCsvValues(settings.excludeDomains);
  excludeAddressesInput.value = joinCsvValues(settings.excludeAddresses);
  excludePrefixesInput.value = joinCsvValues(settings.excludePrefixes);
}

function readPostCreateActionsFromForm() {
  return {
    openCreatedList: Boolean(postActionOpenCreatedList.checked),
    keepDialogOpen: Boolean(postActionKeepDialogOpen.checked),
    copySummary: Boolean(postActionCopySummary.checked),
  };
}

function applyPostCreateActionsToForm(rawActions) {
  const actions = rawActions && typeof rawActions === "object" ? rawActions : {};
  postActionOpenCreatedList.checked = Boolean(actions.openCreatedList);
  postActionKeepDialogOpen.checked = Boolean(actions.keepDialogOpen);
  postActionCopySummary.checked = Boolean(actions.copySummary);
}

function findPresetById(presetId) {
  const id = String(presetId || "");
  return recipientPresets.find((preset) => preset.id === id) || null;
}

function renderPresetOptions() {
  while (presetSelect.firstChild) {
    presetSelect.removeChild(presetSelect.firstChild);
  }

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = recipientPresets.length > 0 ? "Select preset" : "No presets saved";
  presetSelect.appendChild(placeholder);

  recipientPresets.forEach((preset) => {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.name;
    presetSelect.appendChild(option);
  });

  presetSelect.value = activePresetId && findPresetById(activePresetId) ? activePresetId : "";
}

async function loadPresets() {
  const response = await browser.runtime.sendMessage({
    type: "getRecipientPresets",
  });

  if (!response || !response.ok) {
    throw new Error((response && response.error) || "Unable to load presets.");
  }

  recipientPresets = Array.isArray(response.presets) ? response.presets : [];
  renderPresetOptions();
}

async function applyPresetSelection() {
  const preset = findPresetById(presetSelect.value);
  if (!preset) {
    setStatus("Select a preset to apply.", true);
    return;
  }

  activePresetId = preset.id;
  applyRuleSettingsToForm(preset.rules || {});
  applyPostCreateActionsToForm(preset.postCreateActions || {});
  const rulesSaveResponse = await browser.runtime.sendMessage({
    type: "saveRecipientRuleSettings",
    settings: readRuleSettingsFromForm(),
  });
  const postSaveResponse = await browser.runtime.sendMessage({
    type: "savePostCreateActions",
    actions: readPostCreateActionsFromForm(),
  });
  if (!rulesSaveResponse || !rulesSaveResponse.ok) {
    throw new Error(
      (rulesSaveResponse && rulesSaveResponse.error) || "Unable to apply preset rule settings."
    );
  }
  if (!postSaveResponse || !postSaveResponse.ok) {
    throw new Error(
      (postSaveResponse && postSaveResponse.error) || "Unable to apply preset post-creation settings."
    );
  }

  setStatus(`Preset applied: ${preset.name}`);
}

async function createPresetFromCurrentSettings() {
  const proposedName = window.prompt("Enter a name for this preset:", "New Preset");
  if (proposedName === null) {
    return;
  }

  const name = String(proposedName).trim();
  if (!name) {
    setStatus("Preset name is required.", true);
    return;
  }

  const response = await browser.runtime.sendMessage({
    type: "saveRecipientPreset",
    preset: {
      name,
      rules: readRuleSettingsFromForm(),
      postCreateActions: readPostCreateActionsFromForm(),
      defaultTargetAddressBookId: "",
    },
  });

  if (!response || !response.ok) {
    throw new Error((response && response.error) || "Unable to create preset.");
  }

  recipientPresets = Array.isArray(response.presets) ? response.presets : [];
  activePresetId = response.preset && response.preset.id ? response.preset.id : "";
  renderPresetOptions();
  setStatus(`Preset created: ${name}`);
}

async function renameSelectedPreset() {
  const preset = findPresetById(presetSelect.value);
  if (!preset) {
    setStatus("Select a preset to rename.", true);
    return;
  }

  const proposedName = window.prompt("Enter the new preset name:", preset.name);
  if (proposedName === null) {
    return;
  }

  const name = String(proposedName).trim();
  if (!name) {
    setStatus("Preset name is required.", true);
    return;
  }

  const response = await browser.runtime.sendMessage({
    type: "renameRecipientPreset",
    presetId: preset.id,
    name,
  });

  if (!response || !response.ok) {
    throw new Error((response && response.error) || "Unable to rename preset.");
  }

  recipientPresets = Array.isArray(response.presets) ? response.presets : [];
  activePresetId = response.preset && response.preset.id ? response.preset.id : "";
  renderPresetOptions();
  setStatus(`Preset renamed: ${name}`);
}

async function deleteSelectedPreset() {
  const preset = findPresetById(presetSelect.value);
  if (!preset) {
    setStatus("Select a preset to delete.", true);
    return;
  }

  const confirmed = window.confirm(`Delete preset "${preset.name}"?`);
  if (!confirmed) {
    return;
  }

  const response = await browser.runtime.sendMessage({
    type: "deleteRecipientPreset",
    presetId: preset.id,
  });

  if (!response || !response.ok) {
    throw new Error((response && response.error) || "Unable to delete preset.");
  }

  recipientPresets = Array.isArray(response.presets) ? response.presets : [];
  activePresetId = "";
  renderPresetOptions();
  setStatus(`Preset deleted: ${preset.name}`);
}

// Loads the effective entry-point settings from the background script.
async function loadSettings() {
  const entryResponse = await browser.runtime.sendMessage({
    type: "getEntryPointSettings",
  });
  const rulesResponse = await browser.runtime.sendMessage({
    type: "getRecipientRuleSettings",
  });
  const postCreateResponse = await browser.runtime.sendMessage({
    type: "getPostCreateActions",
  });

  if (!entryResponse || !entryResponse.ok) {
    throw new Error((entryResponse && entryResponse.error) || "Unable to load settings.");
  }
  if (!rulesResponse || !rulesResponse.ok) {
    throw new Error((rulesResponse && rulesResponse.error) || "Unable to load rule settings.");
  }
  if (!postCreateResponse || !postCreateResponse.ok) {
    throw new Error(
      (postCreateResponse && postCreateResponse.error) || "Unable to load post-creation settings."
    );
  }

  showToolbarButton.checked = Boolean(entryResponse.settings.showToolbarButton);
  showToolsMenuItem.checked = Boolean(entryResponse.settings.showToolsMenuItem);
  applyRuleSettingsToForm(rulesResponse.settings);
  applyPostCreateActionsToForm(postCreateResponse.actions);
  await loadPresets();
}

// Saves the requested entry-point settings and reports compatibility fallback.
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("");

  if (!showToolbarButton.checked && !showToolsMenuItem.checked) {
    setStatus("Enable at least one launch option.", true);
    return;
  }

  setSaving(true);

  try {
    const requestedSettings = {
      showToolbarButton: showToolbarButton.checked,
      showToolsMenuItem: showToolsMenuItem.checked,
    };

    const entryResponse = await browser.runtime.sendMessage({
      type: "saveEntryPointSettings",
      settings: requestedSettings,
    });
    const rulesResponse = await browser.runtime.sendMessage({
      type: "saveRecipientRuleSettings",
      settings: readRuleSettingsFromForm(),
    });
    const postCreateResponse = await browser.runtime.sendMessage({
      type: "savePostCreateActions",
      actions: readPostCreateActionsFromForm(),
    });

    if (!entryResponse || !entryResponse.ok) {
      throw new Error((entryResponse && entryResponse.error) || "Unable to save launch options.");
    }
    if (!rulesResponse || !rulesResponse.ok) {
      throw new Error((rulesResponse && rulesResponse.error) || "Unable to save rule settings.");
    }
    if (!postCreateResponse || !postCreateResponse.ok) {
      throw new Error(
        (postCreateResponse && postCreateResponse.error) || "Unable to save post-creation settings."
      );
    }

    showToolbarButton.checked = Boolean(entryResponse.settings.showToolbarButton);
    showToolsMenuItem.checked = Boolean(entryResponse.settings.showToolsMenuItem);
  applyRuleSettingsToForm(rulesResponse.settings);
    applyPostCreateActionsToForm(postCreateResponse.actions);

    const menuWasUnavailable =
      requestedSettings.showToolsMenuItem && !entryResponse.settings.showToolsMenuItem;
    const toolbarWasKeptEnabled =
      !requestedSettings.showToolbarButton && entryResponse.settings.showToolbarButton;

    if (menuWasUnavailable && toolbarWasKeptEnabled) {
      setStatus(
        "Settings saved. This Thunderbird version could not enable the Tools menu item, so the toolbar button remains enabled.",
        true
      );
    } else {
      setStatus("Settings saved.");
    }
  } catch (error) {
    setStatus(error.message || "Unable to save settings.", true);
  } finally {
    setSaving(false);
  }
});

loadSettings().catch((error) => {
  setStatus(error.message || "Unable to load settings.", true);
});

applyPresetButton.addEventListener("click", () => {
  applyPresetSelection().catch((error) => {
    setStatus(error.message || "Unable to apply preset.", true);
  });
});

createPresetButton.addEventListener("click", () => {
  createPresetFromCurrentSettings().catch((error) => {
    setStatus(error.message || "Unable to create preset.", true);
  });
});

renamePresetButton.addEventListener("click", () => {
  renameSelectedPreset().catch((error) => {
    setStatus(error.message || "Unable to rename preset.", true);
  });
});

deletePresetButton.addEventListener("click", () => {
  deleteSelectedPreset().catch((error) => {
    setStatus(error.message || "Unable to delete preset.", true);
  });
});

presetSelect.addEventListener("change", (event) => {
  activePresetId = String(event.target.value || "");
});
