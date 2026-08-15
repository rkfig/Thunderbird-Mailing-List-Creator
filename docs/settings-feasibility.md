# Settings Feasibility

Status: Implemented

A lightweight settings page is feasible and now included using Manifest v2 options_ui and storage.local.

## Current Setting
- openForReviewAfterCreate
  - Default: true
  - Purpose: Controls temporary post-create behavior that opens/alerts for list review.

## Rationale
- Meets requirement to keep review-opening logic easy to remove after active development.
- Avoids OS-specific features and stays Thunderbird/WebExtension compatible.
