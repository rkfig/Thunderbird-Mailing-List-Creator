# ATN Listing Content Package

Date: 2026-08-16
Project: Mailing List Creator
Repository: https://github.com/rkfig/Thunderbird-Mailing-List-Creator.git

## 1) Add-on Name

Mailing List Creator

## 2) Short Summary

Create Thunderbird mailing lists from the To and CC recipients of selected messages.

## 3) Full Description

Mailing List Creator helps you quickly build a new mailing list from recipients already present in your mailbox.

How it works:
1. Select one or more messages in Thunderbird.
2. Click the Mailing List toolbar action.
3. Review To/CC/BCC recipients and choose which ones to include.
4. Enter a mailing list name and create the list.

Behavior details:
- If no message is selected, the add-on shows a notification and does not proceed.
- Recipients are collected from message headers (To and CC only).
- Duplicate recipient addresses are removed.
- If a list name already exists, you can cancel or explicitly confirm overwrite.

Permissions and why they are needed:
- messagesRead: read To/CC/BCC headers from selected messages.
- addressBooks: create mailing lists and add list members.
- notifications: show user feedback for success/error and guidance.

Data handling:
- The add-on does not send message or address book data to remote servers.
- No analytics, telemetry, advertising, or tracking behavior is implemented.

## 4) Release Notes (Version 2.0.0)

- Rebuilt as a clean Thunderbird MailExtension targeting Thunderbird 153+.
- Added selected-message recipient aggregation for To/CC/BCC addresses.
- Added recipient selection UI with default-selected entries.
- Added mailing list create, overwrite confirmation, verification, and member population flow.
- Added compliance and release-preparation documentation.

## 5) Support Information

Support email:
- 14152271+rkfig@users.noreply.github.com

Support URL:
- https://github.com/rkfig/Thunderbird-Mailing-List-Creator/issues

Homepage URL:
- https://github.com/rkfig/Thunderbird-Mailing-List-Creator.git

## 6) Screenshot Plan (Submission Checklist)

Required screenshots to capture before upload:
1. Toolbar action visible in Thunderbird UI.
2. Recipient dialog open with selected recipients list.
3. Name entry and create action state.
4. Success state (created message and/or review notification).

Capture guidance:
- Avoid personal email addresses in screenshots.
- Use consistent window size and clear text rendering.
- Keep UI language consistent across all screenshots.

## 7) Reviewer Test Notes

Quick test flow for reviewers:
1. Select one or more messages.
2. Click Mailing List toolbar action.
3. Verify To/CC/BCC recipients appear and are selected by default.
4. Enter a unique list name and create list.
5. Confirm list is created and members are added.

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
