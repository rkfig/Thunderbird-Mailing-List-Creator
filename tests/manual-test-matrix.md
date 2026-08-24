# Manual Test Matrix

Date: 2026-08-24

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

11. Address-book picker open/close
- Open the create-list popup with at least one selected message.
- Click Add From Address Book.
- Expected: a separate address-book picker window opens.
- Click Cancel.
- Expected: picker closes without modifying recipient selections.

12. Address-book picker filter and multi-book selection
- Open Add From Address Book.
- Choose Address Book A and filter by a known fragment.
- Select at least one contact email.
- Switch to Address Book B and select at least one additional contact email.
- Click Add Selected.
- Expected: picker closes and selected addresses from both books are added to the main recipient list.

13. Address-book picker persistence and create flow
- Reopen Add From Address Book after saving a first selection.
- Expected: previously selected additional addresses remain selected.
- Return to main dialog and create the list.
- Expected: created list includes message-derived recipients plus added address-book recipients that remain checked.

## Cross-Platform Smoke (if available)
- Windows Thunderbird: run tests 2, 3, and 8.
- macOS Thunderbird: run tests 2, 3, and 8.
- Record any platform-specific failures in docs/compatibility-alert.md and require explicit user acknowledgment.

## Planned 2.3.0 Feature Tests
14. Rules: include/exclude domain precedence
- Configure include domain example.com and exclude domain blocked.example.com.
- Add recipients from both domains.
- Expected: example.com addresses are included except blocked.example.com, with explicit exclusion reasons.

15. Rules: explicit address exclusion precedence
- Configure include domain example.com and exclude exact address user@example.com.
- Expected: user@example.com is excluded and labeled with exact-address exclusion reason.

16. Rules: common sender-pattern exclusion
- Configure exclude prefix patterns including no-reply and donotreply.
- Use message/address-book recipients matching these patterns.
- Expected: matching addresses are excluded during create.

17. Rules note visibility
- Disable rules in settings and open create dialog.
- Expected: include/exclude rules note is hidden.
- Enable rules in settings and reopen create dialog.
- Expected: include/exclude rules note is visible.

18. Recipient dialog compactness and visibility
- Open create dialog with long recipient list.
- Expected: recipient list remains visible without rules/preset controls in dialog.

19. Presets: save and re-apply
- Save a preset from settings containing include/exclude rules and post-create choices.
- Reopen settings and apply preset.
- Expected: rule behavior and post-create selections match saved preset.

20. Presets: rename and delete lifecycle
- Rename an existing preset, then delete it.
- Expected: updated name appears immediately; deleted preset is unavailable after reload.

21. Preset fallback behavior
- Remove or make unavailable the preset's stored default destination address book.
- Apply preset.
- Expected: extension falls back to first writable book and displays non-blocking notice.

22. Multi-book picker global selection persistence
- Select contacts from Book A, switch to Book B, and then back to Book A.
- Expected: previous selections remain checked and global selected count stays accurate.

23. Multi-book picker remove/clear controls
- Use remove-selected and clear-all controls for address-book sourced recipients.
- Expected: counts and recipient list update immediately and remain consistent after reopening picker.

24. Post-create action: open list
- Enable open-created-list action and create a list.
- Expected: target list opens after successful creation while success notification still appears.

25. Post-create action: keep dialog open
- Enable keep-dialog-open action and create a list.
- Expected: success status is shown and dialog remains open for next operation.

26. Post-create action: copy summary
- Enable copy-summary action and create a list.
- Expected: summary text includes list name and recipient count and is available for paste.
