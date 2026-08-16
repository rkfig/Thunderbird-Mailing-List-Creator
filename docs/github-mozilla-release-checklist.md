# GitHub and Mozilla Release Checklist

Date: 2026-08-15
Project: Mailing List Creator

## Status Legend
- Done: Completed locally
- Pending: Can be completed locally later
- Blocked: Requires external information or external account action

## Repository Preparation
- [x] Done - Project isolated in clean sub-repository at mlc-v2/
- [x] Done - Stable git checkpoints and tags created
- [x] Done - README.md created
- [x] Done - CHANGELOG.md created
- [x] Done - .gitignore created
- [ ] Blocked - Add final GitHub repository URL to source headers
- [ ] Blocked - Add final GitHub repository URL to README and manifest homepage_url

## Manifest and Metadata
- [x] Done - Manifest v2 retained for Thunderbird 153 target
- [x] Done - browser_specific_settings.gecko configured
- [x] Done - Permissions reduced to current least-privilege set
- [x] Done - Options page configured
- [x] Done - Icons configured
- [x] Done - Author field added
- [x] Done - Add-on ID updated to controlled-domain format for publication
- [ ] Blocked - Add homepage_url after GitHub repository URL is known

## Validation
- [x] Done - Linux runtime validation recorded for core flow
- [ ] Pending - Linux validation for empty-name rule
- [ ] Pending - Linux validation for special-character rule
- [ ] Pending - Windows smoke validation if available
- [ ] Pending - macOS smoke validation if available

## Packaging
- [x] Done - Packaging instructions documented
- [x] Done - Package artifact can be built from extension root only
- [x] Done - Dist folder ignored by git
- [x] Done - Local XPI package built at dist/mailing-list-creator-2.0.0.xpi
- [ ] Pending - Build final submission XPI after metadata freeze if metadata changes

## Mozilla Submission
- [ ] Blocked - Create or choose GitHub repository
- [ ] Blocked - Push repository to GitHub
- [ ] Blocked - Add final repository URL to headers and docs
- [ ] Blocked - Create ATN listing content and screenshots
- [ ] Blocked - Upload signed submission package to Mozilla/ATN

## Execution Notes
Local execution completed for all steps that do not require:
- GitHub repository URL
- GitHub remote creation/push destination
- Mozilla account submission workflow
