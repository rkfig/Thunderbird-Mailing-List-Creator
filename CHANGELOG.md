# Changelog

## 2.3.0 (In Progress)
- Moved preset management to the settings page (save/apply/rename/delete)
- Added post-create action options (open address book view, keep dialog open, copy summary)
- Improved address-book picker with per-book selected counts, remove-selected-in-view, and clear-all-added controls
- Added source-aware picker selection persistence and compact selected-address preview in picker UI
- Removed review-before-create gating while keeping settings-driven include/exclude filtering in the active create flow
- Added 2.3.0 implementation checklist and test-results templates/documentation updates

## 2.2.0
- Added Add From Address Book flow with a dedicated picker window
- Added per-address-book contact browsing with search/filter support
- Added multi-address-book recipient selection and merge with message-derived recipients
- Updated recipient dialog to reopen with merged recipient set after picker save
- Updated manual test matrix coverage for address-book picker behavior

## 2.1.0
- Added configurable launch entry points for the toolbar button, Tools menu entry, or both
- Added success notifications after mailing list creation completes
- Included Reply-To and From addresses in the selectable address set
- Added documented settings UI source headers and inline function comments for the new settings files
- Refreshed reviewer, submission, and validation documents for the 2.1.0 release

## 2.0.1
- Added local Thunderbird notifications for success, error, and guidance states
- Included the selected message sender from the From header in the address selection list
- Included the selected message Reply-To address in the address selection list when present
- Added a launch-options setting for the toolbar button, the Tools menu entry, or both

## 2.0.0
- Rebuilt the add-on as a fresh Thunderbird MailExtension project
- Added selected-message recipient aggregation for To/CC addresses
- Implemented mailing list create, overwrite, verification, and recipient population flows
- Added options page for post-create review behavior
- Added compliance, test, and submission-preparation documentation
- Added original icon assets and manifest best-practice updates
