# Source Code Submission Instructions

Date: 2026-08-16
Project: Mailing List Creator
Repository: https://github.com/rkfig/Thunderbird-Mailing-List-Creator.git

## Purpose

This document is for Mozilla reviewers and maps to:
- Add-on Policies, section 3.1 Source Code Submission
- Source code submission checklist

## Build Model Used By This Add-on

- No transpilation
- No minification
- No bundling/concatenation tooling
- No generated source files in runtime extension code

The packaged extension is a direct archive of these paths:
- manifest.json
- src/
- images/

## Required Tools

- zip (or equivalent archive tool)
- unzip (for inspection)
- diff (optional verification)
- sha256sum (optional verification)

No npm, yarn, pip, or other package-manager dependencies are required to build the XPI.

## Build Environment Notes

- Primary development and validation environment: Linux.
- Reviewer default environment from Mozilla documentation is expected to work because this project requires only standard archive tools.
- No architecture-specific compilation steps are used.

## Reproducible Build Steps

Run from the source package root (the folder containing manifest.json):

```bash
mkdir -p dist
rm -f dist/mailing-list-creator-2.3.0.xpi
zip -r dist/mailing-list-creator-2.3.0.xpi manifest.json src images -x '*.DS_Store'
```

## Optional Verification Steps

Inspect archive contents:

```bash
unzip -l dist/mailing-list-creator-2.3.0.xpi
```

Compare extracted archive tree to expected package root:

```bash
rm -rf /tmp/mlc-xpi-check
mkdir -p /tmp/mlc-xpi-check
unzip -q dist/mailing-list-creator-2.3.0.xpi -d /tmp/mlc-xpi-check
find /tmp/mlc-xpi-check -maxdepth 2 -type f | sort
```

Optional integrity hash:

```bash
sha256sum dist/mailing-list-creator-2.3.0.xpi
```

## Third-Party Code and Private Dependencies

- No third-party runtime libraries are bundled.
- No private repositories or private frameworks are required for build.

## Obfuscation and Remote Code Statement

- No obfuscated code is used.
- No remote code is loaded for execution.

## Submission Packaging Guidance

When source upload is requested for a version:
1. Upload a source archive containing the repository files needed to reproduce the package.
2. Include this file in the source archive.
3. Ensure the uploaded source corresponds to the exact tagged/committed version being submitted.
