# Mozilla Policy Audit - 2026-08-16

Scope:
- https://extensionworkshop.com/documentation/publish/add-on-policies/
- https://extensionworkshop.com/documentation/publish/source-code-submission/

Project:
- Mailing List Creator (Thunderbird MailExtension)

Overall Result:
- Conditional pass.
- No blocking code-policy violations identified in shipped extension runtime code.
- Submission-process items remain open and must be completed before AMO/ATN submission.

## Findings (Action Required)

1. Submission readiness gap: reviewer build/source package process is not fully documented.
- Severity: Medium
- Policy mapping: Add-on Policies 3.1 Source Code Submission; Source code submission checklist
- Current state:
  - Build packaging exists in README and docs/packaging-and-submission-notes.md.
  - There is no dedicated source-submission README/checklist that explicitly states reviewer environment assumptions, exact reproducible commands, and tool version pinning strategy in source-submission format.
- Impact:
  - Can cause review delay/rejection if reviewer asks for source package details in required format.
- Recommendation:
  - Add a source-submission document with exact reproducible commands and environment notes aligned to Mozilla checklist wording.

2. Listing/disclosure evidence not yet finalized in repository artifacts.
- Severity: Medium
- Policy mapping: Add-on Policies 1 (No Surprises), 2 (Content), 3 (Submission Guidelines)
- Current state:
  - README describes behavior, but final listing text/screenshots and payment/disclosure attestations are still pending in release checklist.
- Impact:
  - Review can be delayed or rejected if listing metadata does not fully match runtime behavior and disclosure requirements.
- Recommendation:
  - Finalize listing copy and submission metadata package before upload.

## Code Policy Checks

1. Least privilege permissions
- Status: Pass
- Evidence: manifest permissions limited to addressBooks, messagesRead, notifications, storage.

2. No remote code execution/loading
- Status: Pass
- Evidence: only local extension scripts/pages are referenced; no dynamic remote script loading or eval/new Function patterns.

3. No prohibited new tab redirection behavior
- Status: Pass
- Evidence: no new tab replacement logic or remote new-tab behavior.

4. No CSP relaxation behavior
- Status: Pass
- Evidence: no code that modifies webpage security headers.

5. Data transmission/security rules
- Status: Pass (no remote transmission observed)
- Evidence: no network APIs used in extension runtime code paths.

6. UserScripts restrictions
- Status: Pass (not used)
- Evidence: no userScripts API usage.

7. Native messaging privacy rules
- Status: Pass (not used)
- Evidence: no nativeMessaging usage.

8. Obfuscation prohibition
- Status: Pass
- Evidence: readable source code; no obfuscation patterns found.

9. Minification/source requirement applicability
- Status: Pass with note
- Evidence: no bundling/minified/generated artifacts in shipped source tree.
- Note:
  - If future builds introduce minification/transpilation/bundling, source archive + reproducible build instructions become mandatory per policy.

## Process/Release Gates Still Open

- Linux manual validations 5 and 6 still marked not run in tests/manual-test-results-2026-08-15.md.
- Windows/macOS smoke checks still pending.
- Release checklist still contains pending Mozilla submission tasks.

## Evidence Files Reviewed

- manifest.json
- src/background/main.js
- src/ui/recipient-dialog/index.js
- src/ui/recipient-dialog/index.html
- src/options/index.js
- README.md
- docs/packaging-and-submission-notes.md
- docs/github-mozilla-release-checklist.md
- docs/mozilla-thunderbird-compliance-checklist.md
- tests/manual-test-results-2026-08-15.md

## Auditor Note

This audit evaluates repository code and documentation evidence against the cited policy pages. Final compliance determination by Mozilla may still depend on listing metadata, submission artifacts, and reviewer interpretation during AMO/ATN review.