# Mailing List Creator

Thunderbird MailExtension for creating a mailing list from the To, CC, and BCC recipients of one or more selected messages.

Repository: https://github.com/rkfig/Thunderbird-Mailing-List-Creator.git

## Current Status
- Target Thunderbird version: 70.0 (minimum supported)
- Manifest version: 2
- Primary validated platform: Linux
- Working checkpoint tag: working-stable-08

## Features
- Toolbar action titled Mailing List
- Prevents action when no message is selected
- Aggregates To/CC/BCC recipients from selected messages
- Lets the user choose which recipients to include
- Lets the user choose the destination address book during creation
- Creates or overwrites mailing lists after confirmation

## Development Layout
- manifest.json: Thunderbird extension manifest
- src/background/main.js: background workflow and Thunderbird API integration
- src/ui/recipient-dialog/: create-list dialog UI
- images/: extension icons
- docs/: compliance, roadmap, and release-prep documents
- tests/: manual validation artifacts

## Local Validation
Runtime validation completed on Thunderbird 153.0 (64 bit) on Linux for the main create-list workflow, including empty-name and special-character validation. See tests/manual-test-results-2026-08-15.md for current recorded status.

## Packaging
Expected package root contents:
- manifest.json
- src/
- images/

Suggested packaging command:
```bash
mkdir -p dist
zip -r dist/mailing-list-creator-2.0.0.xpi manifest.json src images -x '*.DS_Store'
```

## Submission Notes
Before Mozilla submission:
- Complete remaining cross-platform smoke validations if available

## Author
Ryan Figgins
mailing-list-creator@rkfig.com
