# ATN Listing Content Package

Date: 2026-08-16
Project: Mailing List Creator
Repository: https://github.com/rkfig/Thunderbird-Mailing-List-Creator.git

## 1) Add-on Name

Mailing List Creator

## 2) Short Summary

Create Thunderbird mailing lists from the Reply-To, From, To, CC, and BCC addresses of selected messages while choosing the destination address book.

## 3) Full Description

Mailing List Creator helps you quickly build a new mailing list from recipients already present in your mailbox.

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

## 4) Release Notes (Version 2.3.0 Draft)

Draft status: pending Thunderbird runtime validation and final packaging.

- Moved preset management to the settings page (save/apply/rename/delete).
- Added optional post-create actions (open address book view, keep dialog open, copy summary).
- Improved Add From Address Book with per-book selected counts, remove-selected-in-view, clear-all-added, and selected-address preview.
- Simplified the create dialog to keep recipient selection visible and focused.

Legacy release note reference:

- Added launch settings so the add-on can appear from the toolbar button, the Tools menu, or both.
- Added Reply-To and sender addresses to the selectable address list.
- Added a success notification after a mailing list is created.

## 5) Support Information

Support email:
- 14152271+rkfig@users.noreply.github.com

Support URL:
- https://github.com/rkfig/Thunderbird-Mailing-List-Creator/issues

Homepage URL:
- https://github.com/rkfig/Thunderbird-Mailing-List-Creator.git

## 6) Screenshot Plan (Submission Checklist)

Required screenshots to capture before upload:
1. Mailing List button and Tools menu items visible.png
2. Extension window.png
3. Option page in Add-On Manager.png
4. Successful creation notification.png

Capture guidance:
- Avoid personal email addresses in screenshots.
- Use consistent window size and clear text rendering.
- Keep UI language consistent across all screenshots.

## 7) Reviewer Test Notes

Quick test flow for reviewers:
1. Select one or more messages.
2. Click Mailing List toolbar action.
3. Verify the address-book dropdown appears and defaults to a writable address book.
4. Verify Reply-To/From/To/CC/BCC addresses appear and are selected by default.
5. Enter a unique list name and create list.
6. Confirm Thunderbird shows a local success notification after creation.
7. Confirm list is created and members are added in the selected address book.
8. Open the add-on settings and verify launch options can enable the Tools menu entry and keep at least one launch option active.

Expected validation behavior:
- Empty list name shows an explicit validation message.
- Disallowed special characters show explicit validation message.
- Existing list name triggers overwrite confirmation flow.

## 8) Submission Form Mapping

Use this file to fill these ATN fields:
- Name: section 1
- Summary: section 2
- Description: section 3
- Release notes: section 4
- Support email/URL: section 5
- Homepage: section 5
- Screenshots: section 6
