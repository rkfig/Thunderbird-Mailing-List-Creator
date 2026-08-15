/* global browser */

function notify(id, message) {
  return browser.notifications.create(id, {
    type: "basic",
    title: "Mailing List Creator",
    message,
  });
}

async function hasDisplayedMessage() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab || !tab.id) {
    return false;
  }

  const message = await browser.messageDisplay.getDisplayedMessage(tab.id);
  return Boolean(message && message.id);
}

async function onToolbarClicked() {
  try {
    const selected = await hasDisplayedMessage();
    if (!selected) {
      await notify("no-selected-email", "Select an email first to create a mailing list.");
      return;
    }

    await browser.windows.create({
      type: "popup",
      url: "src/ui/recipient-dialog/index.html",
      width: 760,
      height: 620,
    });
  } catch (error) {
    await notify("mailing-list-error", `Unable to open Mailing List window: ${error.message || String(error)}`);
  }
}

browser.browserAction.onClicked.addListener(onToolbarClicked);
