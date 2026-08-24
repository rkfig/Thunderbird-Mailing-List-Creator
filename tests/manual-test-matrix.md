# Manual Test Matrix

Date: 2026-08-23

## Required Environment
- Thunderbird 70.0 or newer (minimum supported)
- Thunderbird 153.0 (64 bit) recommended for parity with recorded validation
- Linux primary validation target

## Core Functional Tests
1. Toolbar visibility
- Confirm toolbar action title appears as Mailing List.

2. No selected email click
- Click Mailing List with no message selected.
- Expected: notification says to select an email first.
- Expected: recipient popup does not open.

3. Selected email click
- Select a message with a Reply-To and/or sender plus To, CC, and/or BCC recipients.
- Click Mailing List.
- Expected: popup opens with list name input and Reply-To/sender/recipient addresses.

4. Recipient default state
- Verify each recipient control is selected by default.
- Toggle one off and verify selected-count updates.

5. Name validation: empty
- Leave name empty and click Create Mailing List.
- Expected: No Mailing List Name entered.

6. Name validation: special character
- Enter name with unsupported character, example Team@List.
- Expected: Special Character Not Allowed: @.

7. Existing name flow
- Use an existing list name.
- Expected prompt: A list with that name already exists. Do you want to overwrite it?
- If Yes: second prompt Are you sure?
- If No: return to popup and allow re-entry.

8. Create + verify + add recipients
- Create a new unique list name.
- Expected: list is created and all still-selected Reply-To/sender/recipient addresses are added.

9. Launch settings
- Open the add-on settings page.
- Enable the Tools menu option and save.
- Expected: a Mailing List entry appears in Thunderbird's Tools menu on supported Thunderbird versions.
- Disable the toolbar button while leaving the Tools menu option enabled, then save.
- Expected: the toolbar button becomes inactive and the Tools menu entry remains available.
- If the running Thunderbird build does not support Tools menu items, expected: the settings page explains that the toolbar button remains enabled.

10. Success notification
- Create a new mailing list successfully.
- Expected: Thunderbird shows a local success notification with the created list name and recipient count.

## Cross-Platform Smoke (if available)
- Windows Thunderbird: run tests 2, 3, and 8.
- macOS Thunderbird: run tests 2, 3, and 8.
- Record any platform-specific failures in docs/compatibility-alert.md and require explicit user acknowledgment.
