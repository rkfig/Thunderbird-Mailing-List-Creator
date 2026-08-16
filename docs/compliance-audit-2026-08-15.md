# Compliance Audit Report

Date: 2026-08-15
Scope: Full static audit of mlc-v2 codebase against docs/mozilla-thunderbird-compliance-checklist.md
Auditor: GitHub Copilot

## Summary
- Overall result: Conditional Pass
- Passed items: Core Manifest v2 baseline, API fallback architecture, error-path handling, and checkpoint traceability.
- Noncompliance count (initial): 5
  - High: 2
  - Medium: 2
  - Low: 1
- Current unresolved noncompliance: 0
  - Remaining open release gates: Linux tests 5 and 6, cross-platform smoke tests, final permission audit.

## Noncompliance Findings

### HIGH-1: Multi-message recipient requirement not implemented
- Checklist area: 4) Required Functional Behavior
- Requirement intent: Display addresses from selected emails (plural) To and CC.
- Current implementation: Uses only one displayed message via messageDisplay.getDisplayedMessage, then reads that single message headers.
- Evidence:
  - src/background/main.js lines 368-377
  - src/background/main.js lines 382-399
  - src/background/main.js lines 412-419
- Impact:
  - If multiple messages are selected, recipients from non-displayed selected messages are omitted.
- Recommended remediation:
  - Use messages.list + message selection context (or equivalent selected-message enumeration API for Thunderbird 153) and aggregate To/CC across all selected message ids.

### HIGH-2: Recipient controls are checkboxes, not radio buttons
- Checklist area: 4) Required Functional Behavior
- Requirement intent: Have a radio button for each listed email selected by default (as requested).
- Current implementation: Uses checkboxes.
- Evidence:
  - src/ui/recipient-dialog/index.js line 45
- Impact:
  - UI control type does not match stated requirement text.
- Recommended remediation:
  - Confirm intended behavior. If independent on/off per recipient is required, update requirement wording from radio to checkbox/toggle.
  - If strict radio requirement is mandatory, redesign selection model accordingly (single selection semantics).

### MEDIUM-1: Final "open new mailing list for review" behavior is not guaranteed to open that specific list
- Checklist area: 4) Required Functional Behavior
- Requirement intent: Open the new mailing list for review.
- Current implementation: Attempts addressBooks.openUI(createdList.id), then falls back to notification.
- Evidence:
  - src/background/main.js lines 344-360
- Impact:
  - Depending on API behavior, UI may open address book generally or only show notification; the specific list may not auto-open.
- Recommended remediation:
  - Implement deterministic review opening path if API supports deep-linking/selecting a list.
  - Otherwise keep notification fallback and mark this checklist item as Partial by design.

### MEDIUM-2: Checklist/testing evidence is stale vs observed runtime results
- Checklist area: 3, 4, 6, 7, 8 (verification gates)
- Current implementation: Manual test results still show all tests as not run.
- Evidence:
  - tests/manual-test-results-2026-08-15.md lines 10-43
- Impact:
  - Compliance artifact does not reflect actual validated behavior already observed, reducing audit reliability.
- Recommended remediation:
  - Update test results file with executed outcomes from current Thunderbird runtime validation.

### LOW-1: Safe DOM guideline is partially violated by innerHTML usage
- Checklist area: 5) Security and Safe Coding Practices
- Current implementation: Uses innerHTML for container clear and empty-state HTML string.
- Evidence:
  - src/ui/recipient-dialog/index.js lines 31 and 34
- Impact:
  - Low immediate risk because current string is static, but this conflicts with strict avoid-innerHTML guidance.
- Recommended remediation:
  - Replace with DOM node creation and textContent-only rendering.

## Additional Observations (Not marked noncompliance)
- Permission least-privilege review remains open by checklist design and should be finalized at release freeze.
- Compatibility alert workflow exists and is correctly documented.

## Recommended Next Actions
1. Decide requirement interpretation for radio vs checkbox controls.
2. Implement selected-messages aggregation if plural selection support is required.
3. Update manual results and compliance checklist statuses to reflect tested behavior.
4. Optionally harden UI rendering to remove remaining innerHTML usage.

## Alert Record
This report constitutes the requested alert for all currently identified noncompliance items.

## Disposition Update
Date: 2026-08-15

- HIGH-1: Resolved
  - Implemented selected-message aggregation before recipient parsing.
  - Evidence: src/background/main.js getSelectedOrDisplayedMessages and extractRecipients.
- HIGH-2: Accepted deviation by project owner
  - Checkboxes are explicitly accepted instead of radio buttons.
- MEDIUM-1: Accepted deviation by project owner
  - Notification fallback is explicitly accepted instead of guaranteed auto-open to a specific list.
- LOW-1: Resolved
  - Removed remaining innerHTML usage in recipient dialog renderer.
  - Evidence: src/ui/recipient-dialog/index.js renderRecipients.

### Remaining Open Noncompliance
- None.

### Remaining Open Release Gates (Non-Noncompliance)
- Complete Linux test matrix items 5 and 6 (empty-name and special-character validation).
- Run Windows/macOS smoke tests if available.
- Perform final permission least-privilege audit before release.
