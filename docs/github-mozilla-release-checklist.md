# GitHub and Mozilla Release Checklist

Date: 2026-08-16
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
- [x] Done - Added final GitHub repository URL to source headers
- [x] Done - Added final GitHub repository URL to README and manifest homepage_url
- [x] Done - Pushed main branch to GitHub origin
- [x] Done - Pushed release checkpoint tags to GitHub origin

## Manifest and Metadata
- [x] Done - Manifest v2 retained with Thunderbird 70 minimum support
- [x] Done - browser_specific_settings.gecko configured
- [x] Done - Permissions reduced to current least-privilege set
- [x] Done - Options page removed and manifest options_ui cleaned up
- [x] Done - Icons configured
- [x] Done - Author field added
- [x] Done - Add-on ID updated to controlled-domain format for publication
- [x] Done - Added homepage_url using final GitHub repository URL

## Validation
- [x] Done - Linux runtime validation recorded for core flow
- [x] Done - Linux validation for empty-name rule
- [x] Done - Linux validation for special-character rule
- [ ] Pending - Windows smoke validation if available
- [ ] Pending - macOS smoke validation if available

## Packaging
- [x] Done - Packaging instructions documented
- [x] Done - Source-code submission instructions documented for reviewer workflow
- [x] Done - Package artifact can be built from extension root only
- [x] Done - Dist folder ignored by git
- [x] Done - Local XPI package built at dist/mailing-list-creator-2.0.0.xpi
- [x] Done - Built updated submission XPI at dist/mailing-list-creator-2.0.0.xpi

## Mozilla Submission
- [x] Done - Create or choose GitHub repository
- [x] Done - Push repository to GitHub
- [x] Done - Add final repository URL to headers and docs
- [x] Done - Draft ATN listing content package in docs/atn-listing-content-package.md
- [ ] Pending - Capture and finalize ATN screenshots
- [ ] Pending - Upload signed submission package to Mozilla/ATN

## Execution Notes
Local execution completed for all repository-side steps.
Final repo-side release snapshot prepared.
Remaining work is submission-side:
- ATN listing content and screenshots
- Final submission upload and review workflow
