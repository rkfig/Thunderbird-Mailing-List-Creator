# Settings Feasibility

Status: Implemented

The extension now includes a small settings page for launch-entry preferences.

## Current Behavior
- Address-book selection is handled directly in the create dialog.
- Users can enable the toolbar button, the Tools menu entry, or both.
- Launch-entry preferences are stored locally with the storage API.

## Rationale
- The launch surface is a real user preference and is narrow enough to justify a dedicated options page.
- Thunderbird does not expose a runtime API to fully hide the toolbar button, so disabling that option makes the button inactive instead.
- The Tools menu entry is enabled through Thunderbird's menus API and may be unavailable on older Thunderbird builds.
