# Manual Test Results - 2026-08-23

Environment notes:
- Thunderbird version: 153.0 (64 bit)
- OS: Linux
- Build channel: Not recorded

## Core Functional Tests
1. Toolbar visibility
- Result: Pass
- Notes: Toolbar action remains available and usable when enabled in launch settings.

2. No selected email click
- Result: Pass
- Notes: Clicking with no selected message still shows the expected notification and does not open the dialog.

3. Selected email click
- Result: Pass
- Notes: Clicking with a selected message opens the dialog and shows the current address set.

4. Recipient default state
- Result: Pass
- Notes: Displayed addresses are selected by default and the selected-count summary updates as expected.

5. Name validation: empty
- Result: Pass
- Notes: Empty list name shows the expected validation message.

6. Name validation: special character
- Result: Pass
- Notes: Unsupported characters still show the expected validation message.

7. Existing name flow
- Result: Pass
- Notes: Existing-name overwrite confirmation behavior remains correct.

8. Create + verify + add recipients
- Result: Pass
- Notes: Mailing list creation succeeded and selected Reply-To/From/To/CC/BCC addresses were added.

9. Launch settings
- Result: Pass
- Notes: Tools menu entry appeared when enabled, toolbar + Tools menu dual-launch worked, and the options page saved settings correctly.

10. Success notification
- Result: Pass
- Notes: Thunderbird shows the expected success notification after mailing list creation completes.

## Listing and Screenshot Artifacts
- Result: Pass
- Notes: Current screenshot set in docs/screenshots/ shows the extension window, Tools menu entry, options page, and success notification with private email content pixelated.

## Cross-Platform Smoke
- Windows tests 2/3/8: Not run
- macOS tests 2/3/8: Not run

## Outcome
- Current Linux runtime validation completed for the 2.1.0 feature set.
- Remaining validation items: Windows/macOS smoke checks.