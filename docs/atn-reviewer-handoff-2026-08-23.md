# ATN Reviewer Handoff - 2026-08-23

Project: Mailing List Creator
Version: 2.1.0
Repository: https://github.com/rkfig/Thunderbird-Mailing-List-Creator.git
XPI: dist/mailing-list-creator-2.1.0.xpi

## Paste-Ready ATN Fields

### Name

Mailing List Creator

### Summary

Create Thunderbird mailing lists from the Reply-To, From, To, CC, and BCC addresses of selected messages while choosing the destination address book.

### Description

Mailing List Creator helps you quickly build a new mailing list from addresses already present in your mailbox.

You can launch it from the toolbar button, the Tools menu, or both by using the add-on settings page.

How it works:
1. Select one or more messages in Thunderbird.
2. Click the Mailing List toolbar action.
3. Choose the destination address book.
4. Review Reply-To/From/To/CC/BCC addresses and choose which ones to include.
5. Enter a mailing list name and create the list.

Behavior details:
- If no message is selected, the add-on shows toolbar feedback and does not proceed.
- Addresses are collected from message headers (Reply-To, From, To, CC, and BCC).
- Duplicate addresses are removed across the combined reply-to/sender/recipient set.
- Add-on settings let the user enable the toolbar button, the Tools menu entry, or both.
- If a list name already exists, you can cancel or explicitly confirm overwrite.

Permissions and why they are needed:
- messagesRead: read Reply-To/From/To/CC/BCC headers from selected messages.
- addressBooks: create mailing lists and add list members.
- notifications: show local success and error notifications related to mailing list creation.
- menus: add a launch entry to Thunderbird's Tools menu when enabled in settings.
- storage: save the user's launch-entry preference locally.

Data handling:
- The add-on does not send message or address book data to remote servers.
- No analytics, telemetry, advertising, or tracking behavior is implemented.
- Notifications are generated locally in Thunderbird only.

### Release Notes

- Added launch settings so the add-on can appear from the toolbar button, the Tools menu, or both.
- Added Reply-To and sender addresses to the selectable address list.
- Added a success notification after a mailing list is created.

### Support Email

14152271+rkfig@users.noreply.github.com

### Support URL

https://github.com/rkfig/Thunderbird-Mailing-List-Creator/issues

### Homepage URL

https://github.com/rkfig/Thunderbird-Mailing-List-Creator.git

## Screenshots To Upload

Upload these files from docs/screenshots/:

1. Mailing List button and Tools menu items visible.png
2. Extension window.png
3. Option page in Add-On Manager.png
4. Successful creation notification.png

Note:
- Current screenshots have private email content pixelated.

## Reviewer Test Notes

Use this as reviewer-facing testing information if needed:

1. Select one or more messages.
2. Click Mailing List from the toolbar button.
3. Verify the address-book dropdown appears and defaults to a writable address book.
4. Verify Reply-To/From/To/CC/BCC addresses appear and are selected by default.
5. Enter a unique list name and create the list.
6. Confirm Thunderbird shows a local success notification after creation.
7. Confirm the list is created and members are added in the selected address book.
8. Open the add-on settings and verify launch options can enable the Tools menu entry and keep at least one launch option active.

Expected validation behavior:
- Empty list name shows: No Mailing List Name entered
- Unsupported special character shows: Special Character Not Allowed: @
- Existing list name triggers the overwrite confirmation flow

## Submission Checklist

1. Upload dist/mailing-list-creator-2.1.0.xpi.
2. Copy the Name, Summary, Description, Release Notes, Support, and Homepage fields from this file.
3. Upload the four screenshots listed above.
4. Confirm the live ATN listing matches this document before final submission.
5. If available, complete Windows/macOS smoke checks and record them separately.