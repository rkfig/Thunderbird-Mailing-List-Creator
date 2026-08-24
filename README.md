# Mailing List Creator

Thunderbird MailExtension for creating a mailing list from the From, To, CC, BCC, and Reply-To addresses of one or more selected messages.

Repository: https://github.com/rkfig/Thunderbird-Mailing-List-Creator.git

## Current Status
- Target Thunderbird version: 70.0 (minimum supported)
- Manifest version: 2
- Current add-on version: 2.3.0
- 2.3.0 status: in active development (settings-based presets, post-create actions, and picker polish implemented)
- Primary validated platform: Linux
- Working checkpoint tag: working-stable-08

## Features
- Toolbar action titled Mailing List
- Launch options setting for toolbar button, Tools menu entry, or both
- Prevents action when no message is selected
- Aggregates From/To/CC/BCC/Reply-To addresses from selected messages
- Lets the user choose which recipients to include
- Adds optional extra recipients from one or more address books
- Supports contact filtering by name or email in the address-book picker
- Supports per-address-book selected counts and compact selected-address preview in the picker
- Lets the user choose the destination address book during creation
- Creates or overwrites mailing lists after confirmation
- Adds preset save/apply/rename/delete support for after-creation preferences
- Adds optional post-create actions (open address book view, keep dialog open, copy summary)

## Development Layout
- manifest.json: Thunderbird extension manifest
- src/background/main.js: background workflow and Thunderbird API integration
- src/ui/recipient-dialog/: create-list dialog UI
- src/ui/address-book-picker/: add-from-address-book picker UI
- src/ui/settings/: add-on settings for launch entry points
- images/: extension icons
- docs/: compliance, roadmap, and release-prep documents
- tests/: manual validation artifacts

## 2.3.0 Planning Artifacts
- Implementation checklist: docs/2.3.0-implementation-checklist.md
- Manual test results template: tests/manual-test-results-2.3.0-template.md

## Local Validation
Runtime validation completed on Thunderbird 153.0 (64 bit) on Linux for the 2.1.0 workflow, launch settings, and success notifications. Address-book picker validation for 2.2.0 is tracked in the manual test matrix and pending runtime execution.

2.3.0 manual runtime validation is complete and recorded in tests/manual-test-results-2026-08-23-2.3.0-dev.md.

## Packaging
Expected package root contents:
- manifest.json
- src/
- images/

Suggested packaging command:
```bash
mkdir -p dist
zip -r dist/mailing-list-creator-2.3.0.xpi manifest.json src images -x '*.DS_Store'
```

## Submission Notes
Before Mozilla submission:
- Complete remaining cross-platform smoke validations if available

## Author
Ryan Figgins
mailing-list-creator@rkfig.com
