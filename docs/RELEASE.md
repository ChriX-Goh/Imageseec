# Release workflow

Current test build: **2.0 b2**, Chrome numeric version `2.0.0.2`. Feature implementation and partial interaction evidence exist; final acceptance is incomplete. See [status](STATUS.zh-CN.md) and [build record](BUILDS.md).

## Publication boundary

- Test builds may be synchronized to the single canonical GitHub repository, clearly marked as beta and without a compatibility or stable-release claim.
- **Do not upload a package to the Chrome Web Store, submit it for review, or publish it until the owner has completed final acceptance of the exact build and explicitly authorized submission.** Automated checks and developer QA do not replace this decision.
- Preserve the existing live store version while development and owner acceptance are in progress.

## Test version numbering

Use `version_name: "2.0 bN"` for display and `version: "2.0.0.N"` for Chrome's numeric comparison. Increase N for every changed test build delivered for acceptance; rebuilding identical source does not create another beta. b1 starts the recorded sequence; earlier unnumbered candidates have no inferred beta number. Record each delivery and its package digest in BUILDS.md. Do not overwrite an existing numbered delivery with changed source.

Chrome treats missing components as zero. A stable build following `2.0.0.N` must use a larger numeric version (for example `2.0.1`), rather than reverting to `2.0`. Confirm the final displayed name with the actual release record. [Official version rules](https://developer.chrome.com/docs/extensions/reference/manifest/version).

## Release gates

- Run the automated suite and public-source audit from the exact source revision to be delivered.
- Finish and repeat the private 20-site interaction matrix against the final source, including at least 15 distinct gallery/source/loading combinations and no more than two sites per combination. Existing discovery-only counts are not final interaction acceptance.
- Include single/dual view, pane locks, divider limits/reset, synchronized zoom/drag, overview scrolling/selection/return, thumbnail buffering, on-demand scanning and restoration of document/nested scroll positions. Keep identities and evidence private; publish only generic structure tests.
- Verify the 11 UI locales, screenshots, privacy disclosures and permissions against that build. Use generated or author-owned imagery without third-party site branding.
- Deliver the numbered test package and a short acceptance checklist to the owner. Record the owner's actual decision for that exact build; a later code change requires acceptance of the new build.
- Synchronize the canonical GitHub source and project graph without private QA, site identities, credentials or local backups.
- After owner acceptance and submission authorization, build the store ZIP from the same verified source, check the Dashboard diff, submit and verify status. Any later package change follows the same acceptance boundary.

## Build

```sh
python tests/package.py
```

The current output is `dist/Imageseec-v2.0-b2.zip`. The allowlisted ZIP contains runtime files, locale catalogs, icons, README, privacy policy and license. Private QA, test fixtures and local development helpers are excluded. Every packaged file is compared with the local source after ZIP integrity verification.

The 2.0 features add no permission or developer backend. Discovery remains limited to the detected image group and is not guaranteed for every webpage.
