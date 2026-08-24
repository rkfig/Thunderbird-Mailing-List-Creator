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

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? "#b3261e" : "#1c5f57";
}

// Prevents repeat saves while the options page is persisting settings.
function setSaving(inProgress) {
  saveButton.disabled = inProgress;
  saveButton.textContent = inProgress ? "Saving..." : "Save Settings";
}

// Loads the effective entry-point settings from the background script.
async function loadSettings() {
  const response = await browser.runtime.sendMessage({
    type: "getEntryPointSettings",
  });

  if (!response || !response.ok) {
    throw new Error((response && response.error) || "Unable to load settings.");
  }

  showToolbarButton.checked = Boolean(response.settings.showToolbarButton);
  showToolsMenuItem.checked = Boolean(response.settings.showToolsMenuItem);
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

    const response = await browser.runtime.sendMessage({
      type: "saveEntryPointSettings",
      settings: requestedSettings,
    });

    if (!response || !response.ok) {
      throw new Error((response && response.error) || "Unable to save settings.");
    }

    showToolbarButton.checked = Boolean(response.settings.showToolbarButton);
    showToolsMenuItem.checked = Boolean(response.settings.showToolsMenuItem);

    const menuWasUnavailable =
      requestedSettings.showToolsMenuItem && !response.settings.showToolsMenuItem;
    const toolbarWasKeptEnabled =
      !requestedSettings.showToolbarButton && response.settings.showToolbarButton;

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
