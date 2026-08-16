/*
 * Add-on: Mailing List Creator
 * Repository: https://github.com/rkfig/Thunderbird-Mailing-List-Creator.git
 * File: src/options/index.js
 * Manifest Version: 2
 * Header Data Scope: Runtime settings for mailing-list review behavior
 * Permission Basis: storage
 * Compose Permission Note: compose is not required for this incoming-header workflow
 * Purpose: Persists and restores development-time behavior flags for this extension.
 * Author: Ryan Figgins
 * Author Email Address: 14152271+rkfig@users.noreply.github.com
 */

/* global browser, document, window */

const SETTINGS_KEY = "openForReviewAfterCreate";

// Restores persisted option values into the settings UI.
async function restore() {
  const result = await browser.storage.local.get(SETTINGS_KEY);
  const enabled = result[SETTINGS_KEY] !== false;
  document.getElementById("openForReview").checked = enabled;
}

// Saves updated option values and displays brief feedback.
async function save() {
  const enabled = document.getElementById("openForReview").checked;
  await browser.storage.local.set({ [SETTINGS_KEY]: enabled });

  const status = document.getElementById("status");
  status.textContent = "Saved";
  window.setTimeout(() => {
    status.textContent = "";
  }, 900);
}

// Persist changes as soon as the user toggles the option.
document.getElementById("openForReview").addEventListener("change", () => {
  save().catch((error) => {
    document.getElementById("status").textContent = `Save failed: ${error.message || String(error)}`;
  });
});

// Load settings when the options page opens.
restore().catch((error) => {
  document.getElementById("status").textContent = `Load failed: ${error.message || String(error)}`;
});
