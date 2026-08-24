# Submission Prep Pass - 2026-08-23

Project: Mailing List Creator
Target version: 2.1.0

## Repo-Side Checks Completed

1. Manifest metadata reviewed
- Version: 2.1.0
- Add-on ID, homepage URL, permissions, and options page are present in manifest.json.

2. Runtime/source audit completed
- Current source files for the new settings surface include project headers and inline comments where the logic is not self-explanatory.
- Current release-facing docs and reviewer-facing docs were updated to match the 2.1.0 feature set.

3. Manual validation record updated
- Current Linux validation results are recorded in tests/manual-test-results-2026-08-23.md.
- Remaining runtime gap is Windows/macOS smoke validation if available.

4. Screenshot set confirmed
- docs/screenshots/Mailing List button and Tools menu items visible.png
- docs/screenshots/Extension window.png
- docs/screenshots/Option page in Add-On Manager.png
- docs/screenshots/Successful creation notification.png
- Private email content is pixelated in the current captures.

5. Final XPI built successfully
- Artifact: dist/mailing-list-creator-2.1.0.xpi
- Archive contents verified: manifest.json, src/, images/
- SHA-256: 801e2aee54e79db59f2efaeddfe51b9ab4f5d7bab150df3ef4964268c8db2d8d

## Remaining Submission-Side Actions

1. Confirm the live ATN listing fields exactly match docs/atn-listing-content-package.md.
2. Upload dist/mailing-list-creator-2.1.0.xpi to ATN/Mozilla.
3. Execute Windows/macOS smoke checks if those environments are available.

## Submission Recommendation

Repo-side preparation is complete for a 2.1.0 submission package.
The remaining work is ATN-side verification/upload plus optional cross-platform smoke validation.