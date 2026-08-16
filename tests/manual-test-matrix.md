# Manual Test Matrix

Date: 2026-08-15

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
- Select a message with To, CC, and/or BCC recipients.
- Click Mailing List.
- Expected: popup opens with list name input and recipients.

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
- Expected: list is created and recipients still selected are added.

## Cross-Platform Smoke (if available)
- Windows Thunderbird: run tests 2, 3, and 8.
- macOS Thunderbird: run tests 2, 3, and 8.
- Record any platform-specific failures in docs/compatibility-alert.md and require explicit user acknowledgment.
