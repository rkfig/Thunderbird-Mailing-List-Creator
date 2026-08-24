# Manual Test Results - 2026-08-23 (2.3.0 Dev Session)

Environment notes:
- Thunderbird version: Executed manually (user-validated)
- OS: Linux
- Build channel: Release
- Tester: User manual validation
- Runtime execution note: Full baseline and 2.3.0 matrix executed manually in Thunderbird UI.

## Baseline Regression (2.2.0)
1. Toolbar visibility
- Result: Pass
- Notes: Toolbar action visible and active.

2. No selected email click
- Result: Pass
- Notes: Prompt shown and popup blocked when no message is selected.

3. Selected email click
- Result: Pass
- Notes: Popup opened with expected recipients.

4. Recipient default state
- Result: Pass
- Notes: Default selections and count updates behaved correctly.

5. Name validation: empty
- Result: Pass
- Notes: Inline validation displayed correctly near list-name field.

6. Name validation: special character
- Result: Pass
- Notes: Inline validation displayed unsupported character warning.

7. Existing name flow
- Result: Pass
- Notes: Overwrite confirmation flow behaved correctly.

8. Create + verify + add recipients
- Result: Pass
- Notes: Mailing list created and recipients populated as expected.

9. Launch settings
- Result: Pass
- Notes: Launch setting toggles saved and behaved as expected.

10. Success notification
- Result: Pass
- Notes: Success notification displayed after create.

11. Address-book picker open/close
- Result: Pass
- Notes: Picker open/close behavior correct.

12. Address-book picker filter and multi-book selection
- Result: Pass
- Notes: Multi-book selection and filtering worked correctly.

13. Address-book picker persistence and create flow
- Result: Pass
- Notes: Picker selections persisted and create flow remained correct.

## 2.3.0 Feature Tests
14. Settings presets: create and apply
- Result: Pass
- Notes: Preset create/apply worked from settings page.

15. Settings presets: rename and delete lifecycle
- Result: Pass
- Notes: Rename/delete lifecycle worked without reload issues.

16. Settings presets: fallback behavior when default target address book is unavailable
- Result: Pass
- Notes: Fallback behavior handled unavailable default correctly.

17. Recipient dialog compactness and visibility
- Result: Pass
- Notes: Dialog remained compact; recipient list stayed visible.

18. Settings post-create actions persistence and apply behavior
- Result: Pass
- Notes: Post-create action settings persisted and applied correctly.

19. Presets: save and re-apply
- Result: Pass
- Notes: Save/re-apply behavior matched expected settings.

20. Presets: rename and delete lifecycle
- Result: Pass
- Notes: Rename/delete behavior validated end-to-end.

21. Preset fallback behavior
- Result: Pass
- Notes: Fallback behavior worked without blocking create flow.

22. Multi-book picker global selection persistence
- Result: Pass
- Notes: Global selection persisted as expected.

23. Multi-book picker remove/clear controls
- Result: Pass
- Notes: Remove/clear controls updated counts and list consistently.

24. Post-create action: open list
- Result: Pass
- Notes: Open-list post action executed after successful create.

25. Post-create action: keep dialog open
- Result: Pass
- Notes: Dialog stayed open after create when enabled.

26. Post-create action: copy summary
- Result: Pass
- Notes: Summary copied and available for paste.

## Code-Level Checks Completed in This Session
- Editor/static checks reported no errors in updated files.
- Picker polish implemented: per-book selection counts, remove-selected-in-view, clear-all-added.
- Selection-source metadata persisted through background context for picker reopen continuity.

## Outcome
- Overall result: Pass
- Release recommendation: Ready for release pending final ATN upload workflow.
- Blocking items: Windows/macOS smoke validation remains pending if required for final submission policy.
