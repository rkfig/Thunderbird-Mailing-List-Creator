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
- Popup loads To/CC recipients from selected message context.
- Recipient controls are selected by default and can be toggled.
- List name entry plus create/cancel actions are wired.

## checkpoint-04-name-validation-overwrite
- Name validation added: empty name, special character rejection, max length.
- Existing-list detection prompts overwrite confirmation flow.

## checkpoint-05-create-verify-populate-open
- Create list operation implemented with verification step.
- Selected recipients are added to the new list.
- Temporary open-for-review behavior uses supported API or fallback notification.

## Tagging Convention
- stable-01 maps to checkpoint-01-bootstrap.
- stable-02 maps to checkpoint-02-toolbar-selection-gate.
- Continue one stable tag per checkpoint.
