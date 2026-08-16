# Mozilla/Thunderbird Compliance Checklist

Date: 2026-08-15
Scope: Mailing List Creator v2 (Manifest v2 Thunderbird WebExtension)

## Status Legend
- Pass: Implemented and verified by current code review.
- Partial: Implemented but needs runtime/manual verification.
- Pending: Not yet implemented.

## 1) Manifest and API Baseline
- [x] Pass - Manifest v2 used.
  - Evidence: manifest.json sets manifest_version to 2.
- [x] Pass - Thunderbird application metadata defined.
  - Evidence: manifest.json applications.gecko.id and strict_min_version are present.
- [x] Pass - Toolbar action configured.
  - Evidence: manifest.json browser_action.default_title set to Mailing List.
- [x] Pass - No options page is configured.
  - Evidence: manifest.json has no options_ui block.

## 2) Permissions and Least-Privilege
- [x] Pass - Permissions constrained to needed add-on capabilities.
  - Evidence: addressBooks, messagesRead, notifications.
- [ ] Partial - Permissions should be re-checked before release to ensure no unused permission remains.
  - Evidence: final release audit required after feature freeze.

## 3) Thunderbird API Usage
- [x] Pass - Mailing list creation uses Thunderbird-supported mailing list APIs with compatibility fallbacks.
  - Evidence: src/background/main.js uses addressBooks.mailingLists.create and legacy fallback paths.
- [x] Pass - Member population uses contact create + addMember patterns with compatibility handling.
  - Evidence: src/background/main.js addContactToList.
- [x] Pass - Duplicate list detection is scoped to target address book and mailing list nodes.
  - Evidence: src/background/main.js findMailingListByName and listMailingListsForBook.
- [x] Partial - Linux runtime API verification completed for core create flow; cross-platform verification still required.
  - Evidence: tests/manual-test-results-2026-08-15.md.

## 4) Required Functional Behavior
- [x] Pass - Button only proceeds when an email is selected/displayed.
  - Evidence: src/background/main.js hasDisplayedMessage and user notification path; tests/manual-test-results-2026-08-15.md.
- [x] Pass - Recipient dialog shows To/CC/BCC addresses and default selected controls.
  - Evidence: src/ui/recipient-dialog/index.js renderRecipients.
- [x] Partial - Name validation flow includes empty-name, special-character, parse-error cases.
  - Evidence: src/background/main.js validateListName; tests 5 and 6 pending in tests/manual-test-results-2026-08-15.md.
- [x] Pass (Accepted Deviation) - Duplicate-name overwrite confirmation implemented.
  - Evidence: src/ui/recipient-dialog/index.js confirmation flow; tests/manual-test-results-2026-08-15.md.
- [x] Pass - List create, verify, populate, and address-book selection flow implemented.
  - Evidence: src/background/main.js createMailingListFromSelection and recipient dialog addressBookSelect handling.

## 5) Security and Safe Coding Practices
- [x] Pass - Runtime messaging used for UI/background separation.
  - Evidence: src/ui/recipient-dialog/index.js and src/background/main.js runtime message handlers.
- [x] Pass - UI rendering avoids unsafe HTML injection for recipient rows.
  - Evidence: src/ui/recipient-dialog/index.js uses createElement/textContent.
- [x] Pass - Defensive guards for missing context, API availability, and errors.
  - Evidence: src/background/main.js includes multiple guard/fallback paths.
- [x] Pass - Address-book selection is restricted to writable books.
  - Evidence: src/background/main.js toAddressBookOptions and createMailingListFromSelection.

## 6) Cross-Platform and Compatibility Policy
- [x] Pass - No OS-specific runtime logic introduced.
  - Evidence: no Linux-only shell/system dependencies in extension runtime code.
- [x] Pass - Compatibility alert workflow exists for unavoidable platform/API breaks.
  - Evidence: docs/compatibility-alert.md and docs/compatibility-acknowledgment.md.
- [ ] Partial - Windows/macOS smoke verification still pending.
  - Evidence: tests/manual-test-matrix.md defines required smoke tests.

## 7) Testing, Traceability, and Checkpoints
- [x] Pass - Stable git checkpoints and tags established.
  - Evidence: stable-01 through stable-08 plus working-stable-08.
- [x] Pass - Manual test matrix documented.
  - Evidence: tests/manual-test-matrix.md.
- [x] Pass - Manual results file updated with current Linux runtime outcomes.
  - Evidence: tests/manual-test-results-2026-08-15.md.

## 8) Release Readiness Gate
- [ ] Pending - Complete remaining Linux validations (tests 5 and 6) and update results.
- [ ] Pending - Execute Windows/macOS smoke tests if available.
- [x] Pass - Final permission review removed unused options/storage path.
- [x] Pass - Address-book selection strategy confirmed in create dialog.

## Reviewer Sign-Off
- Technical compliance review:
  - Name:
  - Date:
  - Result: Pass / Conditional Pass / Fail
- Runtime validation review:
  - Name:
  - Date:
  - Result: Pass / Conditional Pass / Fail
