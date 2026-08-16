# Packaging and Submission Notes

## Package Root
Build the extension package from the mlc-v2 root only.

Include:
- manifest.json
- src/
- images/

Do not include:
- .git/
- dist/ source packages from previous builds
- outer workspace files
- archive/

## Recommended Pre-Submission Review
1. Confirm manifest metadata is final.
2. Confirm remaining manual tests are recorded.
3. Confirm final add-on ID and repository URL.
4. Confirm all icons and runtime assets load correctly.
5. Build a fresh XPI and install it temporarily in Thunderbird.

## Suggested Final XPI Name
mailing-list-creator-2.0.0.xpi
