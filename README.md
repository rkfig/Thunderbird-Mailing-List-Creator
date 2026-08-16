# Mailing List Creator

Thunderbird MailExtension for creating a mailing list from the To and CC recipients of one or more selected messages.

## Current Status
- Target Thunderbird version: 153.0+
- Manifest version: 2
- Primary validated platform: Linux
- Working checkpoint tag: working-stable-08

## Features
- Toolbar action titled Mailing List
- Prevents action when no message is selected
- Aggregates To/CC recipients from selected messages
- Lets the user choose which recipients to include
- Creates or overwrites mailing lists after confirmation
- Opens or notifies for post-create review
- Provides an options page for the review-open behavior

## Development Layout
- manifest.json: Thunderbird extension manifest
- src/background/main.js: background workflow and Thunderbird API integration
- src/ui/recipient-dialog/: create-list dialog UI
- src/options/: settings UI
- images/: extension icons
- docs/: compliance, roadmap, and release-prep documents
- tests/: manual validation artifacts

## Local Validation
Runtime validation completed on Thunderbird 153.0 (64 bit) on Linux for the main create-list workflow. See tests/manual-test-results-2026-08-15.md for current recorded status.

## Packaging
The extension should be packaged from this folder only.

Expected package root contents:
- manifest.json
- src/
- images/

Suggested packaging command:
```bash
cd mlc-v2
mkdir -p dist
zip -r dist/mailing-list-creator-2.0.0.xpi manifest.json src images -x '*.DS_Store'
```

## Submission Notes
Before Mozilla submission:
- Complete remaining manual validations
- Add final GitHub repository URL to docs and source headers
- Add homepage_url to manifest.json once repository URL is known
- Review permissions one final time

## Author
Ryan Figgins
mailing-list-creator@rkfig.com
