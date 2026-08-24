# Release Notes - 2.3.0

Date: 2026-08-23
Project: Mailing List Creator

## Highlights

- Added settings-driven include/exclude recipient filtering for list creation.
- Moved preset management to the settings page with create, apply, rename, and delete actions.
- Added post-create actions:
  - Open Address Book view
  - Keep dialog open
  - Copy summary to clipboard
- Improved Add From Address Book workflow:
  - Per-book selected counts
  - Remove-selected-in-view and clear-all controls
  - Persisted cross-book selection behavior
- Simplified recipient dialog layout so recipient selection remains visible and focused.
- Added inline list-name validation display for empty name and unsupported special characters.

## Compatibility and Safety

- No new permissions added.
- No network or telemetry behavior introduced.
- Existing overwrite-confirmation safeguards are retained.

## Validation Status

- Baseline regression and 2.3.0 feature matrix were manually validated and recorded in tests/manual-test-results-2026-08-23-2.3.0-dev.md.
- Windows/macOS smoke validation remains optional/pending per the release checklist.
