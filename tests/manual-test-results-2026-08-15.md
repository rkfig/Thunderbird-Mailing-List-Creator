# Manual Test Results - 2026-08-15

Environment notes:
- Thunderbird version: 153.0 (64 bit)
- OS: Linux
- Build channel: Not recorded

## Core Functional Tests
1. Toolbar visibility
- Result: Pass
- Notes: Action is available and usable in runtime validation sessions.

2. No selected email click
- Result: Pass
- Notes: Implemented and behavior validated earlier in runtime flow checks.

3. Selected email click
- Result: Pass
- Notes: Clicking with selected email opens dialog and allows list creation flow.

4. Recipient default state
- Result: Pass
- Notes: Correct addresses were displayed and defaults allowed expected selection behavior.

5. Name validation: empty
- Result: Pass
- Notes: Verified that clicking Create Mailing List with an empty name shows the expected empty-name validation message.

6. Name validation: special character
- Result: Pass
- Notes: Verified that entering an unsupported character shows the expected special-character validation message.

7. Existing name flow
- Result: Pass (after fix)
- Notes: False positive duplicate warning was fixed; current behavior now matches intent.

8. Create + verify + add recipients
- Result: Pass
- Notes: Mailing list creation succeeded; correct selected addresses were added.

## Cross-Platform Smoke
- Windows tests 2/3/8: Not run
- macOS tests 2/3/8: Not run

## Outcome
- Core Linux runtime validation completed for implemented flow and accepted fixes.
- Remaining validation items: Windows/macOS smoke checks.
