# Mailing List Creator User Guide

Date: 2026-08-24
Version: 2.3.1

## What This Add-on Does

Mailing List Creator helps you create Thunderbird mailing lists from message recipients.

It can collect addresses from:
- From
- To
- CC
- BCC
- Reply-To

You can also add extra recipients from your address books before creating the list.

## Install from an XPI File

1. Download or copy the XPI file to your computer.
2. In Thunderbird, open Add-ons and Themes.
3. Select Extensions.
4. Click the gear icon.
5. Choose Install Add-on From File....
6. Select the XPI file, for example:
  - dist/mailing-list-creator-2.3.1.xpi
7. Confirm installation when prompted.
8. Restart Thunderbird if Thunderbird asks you to restart.

## Open the Settings Page

Use either method:

1. Add-ons Manager method
- Open Add-ons and Themes.
- Go to Extensions.
- Find Mailing List Creator.
- Click Preferences or Options.

2. Context method (when available)
- Open the add-on entry in Thunderbird.
- Open extension details.
- Choose Preferences or Options.

## Settings Overview

The settings page contains these sections.

1. Launch Options
- Enable the toolbar button.
- Enable Tools menu entry.
- At least one launch option must remain enabled.

2. After Creation
- Open address book view after successful creation.
- Keep dialog open for another list.
- Copy creation summary to clipboard.

3. Presets
- Save and reuse named settings combinations.
- Actions available:
  - Apply
  - Create Preset
  - Rename
  - Delete

4. Include/Exclude Rules
- Enable include/exclude filtering during list creation.
- Configure comma-separated filters:
  - Include Domains
  - Exclude Domains
  - Exclude Addresses
  - Exclude Prefixes
- These filters are applied during create when rules are enabled.

## Normal Use

1. Select one or more messages in Thunderbird.
2. Open Mailing List Creator from:
- Toolbar button, or
- Tools menu (if enabled)
3. In the dialog:
- Choose destination address book.
- Enter mailing list name.
- Review selected recipients.
- Optionally click Add From Address Book to include additional contacts.
4. Click Create Mailing List.
5. If a list with the same name exists:
- Confirm overwrite when prompted.
6. On success:
- A success message is shown.
- Optional post-create actions run based on your settings.

## Name Validation Behavior

When entering a list name:

- Empty name shows an inline validation message near the name field.
- Unsupported special characters show an inline validation message near the name field.

## Include/Exclude Rules Behavior

- Rules are configured in Settings.
- Rules are applied when creation runs.
- The create dialog shows a rules note only when rules are enabled.

## Add From Address Book Tips

- You can select contacts across multiple source books.
- Selected counts are shown per book.
- You can remove selected items in view or clear all added items.
- Saved selections persist while working in the same create context.

## Troubleshooting

1. Nothing happens when clicking Mailing List
- Make sure at least one message is selected.
- Confirm the launch option you are using is enabled.

2. Cannot find settings
- Open Add-ons and Themes, then Extensions, then Mailing List Creator, then Preferences/Options.

3. Could not create list
- Verify the selected destination address book is writable.
- Check name validation message for unsupported characters.

4. Tools menu entry does not appear
- Some Thunderbird builds may not expose all menu APIs.
- Keep toolbar launch enabled in that case.
