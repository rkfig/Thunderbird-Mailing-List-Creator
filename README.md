# Mailing List Creator

Thunderbird MailExtension for creating a mailing list from the Reply-To, From, To, CC, and BCC addresses of one or more selected messages.

Repository: https://github.com/rkfig/Thunderbird-Mailing-List-Creator.git

## Current Status
- Target Thunderbird version: 70.0 (minimum supported)
- Manifest version: 2
- Current add-on version: 2.1.0
- Primary validated platform: Linux
- Working checkpoint tag: working-stable-08

## Features
- Toolbar action titled Mailing List
- Launch options setting for toolbar button, Tools menu entry, or both
- Prevents action when no message is selected
- Aggregates Reply-To/From/To/CC/BCC addresses from selected messages
- Lets the user choose which recipients to include
- Lets the user choose the destination address book during creation
- Creates or overwrites mailing lists after confirmation

## Development Layout
- manifest.json: Thunderbird extension manifest
- src/background/main.js: background workflow and Thunderbird API integration
- src/ui/recipient-dialog/: create-list dialog UI
- src/ui/settings/: add-on settings for launch entry points
- images/: extension icons
- docs/: compliance, roadmap, and release-prep documents
- tests/: manual validation artifacts

## Local Validation
Runtime validation completed on Thunderbird 153.0 (64 bit) on Linux for the main create-list workflow, launch settings, and success notifications. See tests/manual-test-results-2026-08-23.md for current recorded status, and docs/screenshots/ for the current sanitized listing captures.

## Packaging
Expected package root contents:
- manifest.json
- src/
- images/

Suggested packaging command:
```bash
mkdir -p dist
zip -r dist/mailing-list-creator-2.1.0.xpi manifest.json src images -x '*.DS_Store'
```

## Submission Notes
Before Mozilla submission:
- Complete remaining cross-platform smoke validations if available

## Author
Ryan Figgins
mailing-list-creator@rkfig.com
