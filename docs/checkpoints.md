# Stability Checkpoints

## checkpoint-01-bootstrap
- Fresh repository scaffolded.
- Manifest v2 baseline created.
- Toolbar action named Mailing List added.
- Initial popup shell in place.

## checkpoint-02-toolbar-selection-gate
- Toolbar click now checks for a selected/displayed message.
- User receives notification when no message is selected.
- Popup opens only when a message context exists.

## checkpoint-03-recipient-dialog
- Popup loads To/CC/BCC recipients from selected message context.
- Recipient controls are selected by default and can be toggled.
- Address-book dropdown is shown and defaults to a writable address book.
- List name entry plus create/cancel actions are wired.

## checkpoint-04-name-validation-overwrite
- Name validation added: empty name, special character rejection, max length.
- Existing-list detection prompts overwrite confirmation flow.

## checkpoint-05-create-verify-populate-open
- Create list operation implemented with verification step.
- Selected recipients are added to the new list.
- Selected address book is used for list creation.

## checkpoint-06-settings-or-defer-doc
- Options page removed after the flow was simplified.
- No settings page remains in the extension.
- Address-book selection is handled directly in the create dialog.

## checkpoint-07-guideline-compliance
- Runtime hardening added for context lifecycle and API fallback behavior.
- Recipient selection is validated against the current message context before list creation.
- Create action now blocks double-submission during in-progress operations.

## checkpoint-08-release-candidate
- Compatibility alert and acknowledgment workflow files added.
- Release-candidate manual test results template added.
- Roadmap updated with compatibility and test-results tracking.

## Tagging Convention
- stable-01 maps to checkpoint-01-bootstrap.
- stable-02 maps to checkpoint-02-toolbar-selection-gate.
- Continue one stable tag per checkpoint.
