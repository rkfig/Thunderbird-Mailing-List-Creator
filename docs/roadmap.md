# Mailing List Creator v2 Roadmap

## Scope
- Thunderbird 70.0 minimum support; validated on Thunderbird 153.0 Linux.
- Preserve Windows/macOS compatibility unless explicitly documented and approved.
- Manifest v2 and Mozilla add-on guidelines.

## Milestones
1. checkpoint-01-bootstrap
2. checkpoint-02-toolbar-selection-gate
3. checkpoint-03-recipient-dialog
4. checkpoint-04-name-validation-overwrite
5. checkpoint-05-create-verify-populate-open
6. checkpoint-06-settings-or-defer-doc
7. checkpoint-07-guideline-compliance
8. checkpoint-08-release-candidate

## Tracking
- Manual test checklist: tests/manual-test-matrix.md
- Manual test results: tests/manual-test-results-2026-08-15.md
- 2.3.0 test results template: tests/manual-test-results-2.3.0-template.md
- 2.3.0 implementation checklist: docs/2.3.0-implementation-checklist.md
- Compatibility alert workflow: docs/compatibility-alert.md and docs/compatibility-acknowledgment.md
- Mozilla/Thunderbird compliance checklist: docs/mozilla-thunderbird-compliance-checklist.md

## Release Plan 2.3.0

### Goal
- Improve recipient-list workflow ergonomics by centralizing persistent preferences in settings and keeping the create dialog focused on recipient selection and creation.

### In Scope
1. Saved presets managed from settings
2. Multi-book selection polish in Add From Address Book flow
3. Post-create actions (open list, keep dialog open, copy summary)
4. Recipient-dialog simplification and visibility improvements

### Out of Scope
- Cloud sync, account linking, or network services
- Bulk CSV import (defer to 2.4.x)
- Any permissions expansion beyond current manifest unless explicitly approved

### Implementation Sequence
1. Saved presets
- Add CRUD for named presets in storage.local.
- Preset schema: name, optional default target address book, optional post-create action preferences.
- Add apply/create/rename/delete controls in settings.

2. Multi-book picker polish
- Keep selected contacts when switching source books.
- Add selected-count indicator per source book and global selected-count summary.
- Add clear-all and remove-selected actions for address-book sourced recipients.

3. Post-create actions
- Add options: open created list, keep dialog open for next list, copy result summary.
- Default remains current behavior to avoid user surprise.

4. Recipient dialog simplification
- Remove persistent configuration controls from create dialog.
- Keep recipient list and create flow visible without extra scrolling.

### Acceptance Criteria
1. Presets
- User can save, rename, delete, and apply presets without page reload.
- Presets persist across Thunderbird restarts.

2. Multi-book polish
- Selecting contacts from multiple books preserves previous selections.
- Returning from picker updates the main dialog recipient set without losing manual checkboxes for unchanged addresses.

3. Post-create actions
- Configured post-create action runs reliably after successful list creation.
- Failure in post-create action does not mask create success notification.

4. Recipient dialog simplicity
- Create dialog remains focused on naming and recipient selection.
- Recipient list is visible without preset/rules sections pushing content below the fold.

### Technical Notes
- Keep all feature state in storage.local and current context token model.
- Reuse existing recipient normalization and merge behavior across message and picker sources.
- Keep message handlers explicit and versioned by message.type names for maintainability.

### Reviewer-Safe Checklist
1. Permissions
- No new permissions unless absolutely required; if required, document rationale in docs/manual-review-checks and compliance docs.

2. Data handling
- No external network requests.
- No persistent storage of message body data; only recipient metadata needed for user-selected actions.

3. UX and safety
- Overwrite and destructive actions retain explicit confirmation.
- Post-create options are explicit and reversible in settings.

4. Documentation
- Update README feature list and packaging command version.
- Update CHANGELOG with user-visible behavior and migration notes.
- Update tests/manual-test-matrix with preset/picker/post-create action cases.

### Test Plan Additions
1. Presets
- Save/apply/delete/rename lifecycle.
- Preset fallback when referenced address book no longer exists.

2. Multi-book polish
- Add from Book A and B, switch tabs/books repeatedly, then save.

3. Post-create actions
- Validate each action path and failure fallback behavior.

4. Create dialog
- Verify recipient list remains visible with longer recipient sets and no review/preset panel.

### Release Exit Criteria for 2.3.0
- All existing 2.2.0 manual tests still pass.
- New 2.3.0 matrix cases pass on Linux.
- At least smoke checks for core create flow on Windows and macOS if available.
- Documentation and reviewer package updated and internally consistent.

### 2.3.0 Work Breakdown (Issue-Sized)
1. MLC-2301 - Scope simplification and review-gate removal
- Scope: remove review-panel gating from active flow while keeping include/exclude rules managed in settings.
- Depends on: none.
- Estimate: 2 points.
- Deliverables: remove review panel and preview messaging; keep rules persisted and applied during create.

2. MLC-2305 - Preset storage CRUD
- Scope: create, rename, delete, and list preset definitions in storage.local.
- Depends on: none.
- Estimate: 3 points.
- Deliverables: preset repository helpers and runtime message handlers.

3. MLC-2306 - Preset apply flow in settings
- Scope: add preset selector and apply action that updates post-create preferences from settings.
- Depends on: MLC-2305.
- Estimate: 3 points.
- Deliverables: settings controls, apply behavior, and status messaging.

4. MLC-2307 - Multi-book picker selection polish
- Scope: preserve selections across source books, show per-book and global counts, add clear/remove selected controls.
- Depends on: existing 2.2.0 picker baseline.
- Estimate: 5 points.
- Deliverables: picker UI behavior upgrades and merged-selection integrity checks.

5. MLC-2308 - Post-create action preferences and execution
- Scope: support open list, keep dialog open, and copy summary actions after success.
- Depends on: MLC-2305.
- Estimate: 3 points.
- Deliverables: settings persistence and non-blocking post-create executor.

6. MLC-2309 - Regression hardening and compatibility checks
- Scope: validate no behavior regressions in overwrite confirmations, notifications, launch settings, and picker-return behavior.
- Depends on: MLC-2306, MLC-2307, MLC-2308.
- Estimate: 3 points.
- Deliverables: issue fixes from test pass, compatibility notes for any Thunderbird API deviations.

7. MLC-2310 - Release docs and reviewer package refresh
- Scope: update README, CHANGELOG, manual review docs, and test artifacts for 2.3.0.
- Depends on: all feature tickets complete.
- Estimate: 2 points.
- Deliverables: release-ready docs and submission consistency check.

### Suggested Sprint Order
1. Foundation Sprint: MLC-2301, MLC-2305
2. UX Sprint: MLC-2306
3. Picker and Finish Sprint: MLC-2307, MLC-2308, MLC-2309, MLC-2310
