/* global browser, document */

const SETTINGS_KEY = "openForReviewAfterCreate";

async function restore() {
  const result = await browser.storage.local.get(SETTINGS_KEY);
  const enabled = result[SETTINGS_KEY] !== false;
  document.getElementById("openForReview").checked = enabled;
}

async function save() {
  const enabled = document.getElementById("openForReview").checked;
  await browser.storage.local.set({ [SETTINGS_KEY]: enabled });

  const status = document.getElementById("status");
  status.textContent = "Saved";
  window.setTimeout(() => {
    status.textContent = "";
  }, 900);
}

document.getElementById("openForReview").addEventListener("change", () => {
  save().catch((error) => {
    document.getElementById("status").textContent = `Save failed: ${error.message || String(error)}`;
  });
});

restore().catch((error) => {
  document.getElementById("status").textContent = `Load failed: ${error.message || String(error)}`;
});
