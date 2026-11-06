# Test build record

Number changed source deliveries sequentially: **2.0 b1**, **2.0 b2**, and so on. There is no reliable beta count for the earlier unnumbered candidates; b1 starts this record.

| Build | Chrome version | Date | Scope | Acceptance |
| --- | --- | --- | --- | --- |
| 2.0 b1 | 2.0.0.1 | 2026-11-06 | Initial numbered 2.0 test delivery: comparison, overview, generic lazy discovery, pixel/overlay and scroll-restoration fixes | Developer QA incomplete; owner final acceptance pending; not submitted to the store |
| 2.0 b2 | 2.0.0.2 | 2026-11-06 | Row-ordered vertical overview by default; optional horizontal column browsing; hide borders/captions; direction-aware buffer and scan triggers | Developer QA in progress; owner acceptance pending; no store submission |

## b1

Package: `Imageseec-v2.0-b1.zip`, 32 files, 78,138 bytes.

SHA-256: `bd5b5321f6e02d71c27309ebb38b6593ded7ee71936e59df1d9600a4b22d5324`.

Validation: 45 automated checks pass; options syntax, public-source audit, ZIP integrity and packaged-file equality pass. No new browser interaction sweep was performed for this version-label change. The installed browser instance has not yet been reloaded and checked for the b1 label. The GitHub main branch still points to the previous 1.5.2 release revision; beta source and graph synchronization remain pending. Tests and public-source review are development evidence, not owner acceptance.

## b2

Package: `Imageseec-v2.0-b2.zip`, 32 files, 80,858 bytes. SHA-256: `a072f18fd08f2311581e40d342e4177524f96e93d46b878e3bec4517c0c552b7`. Installed isolated Chromium settings display **2.0 b2**. All 46 automated checks pass. The release remains pending final site acceptance and owner approval.

Future changed deliveries must increment both the visible beta number and Chrome numeric version, update this record and produce a new package filename. The store workflow remains gated by [owner acceptance](RELEASE.md).
