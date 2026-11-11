# Test build record

Number changed source deliveries sequentially: **2.0 b1**, **2.0 b2**, and so on. There is no reliable beta count for the earlier unnumbered candidates; b1 starts this record.

| Build | Chrome version | Date | Scope | Acceptance |
| --- | --- | --- | --- | --- |
| 2.0 b1 | 2.0.0.1 | 2026-11-06 | Initial numbered 2.0 test delivery: comparison, overview, generic lazy discovery, pixel/overlay and scroll-restoration fixes | Developer QA incomplete; owner final acceptance pending; not submitted to the store |
| 2.0 b2 | 2.0.0.2 | 2026-11-06 | Row-ordered vertical overview by default; optional horizontal column browsing; hide borders/captions; direction-aware buffer and scan triggers | Developer QA in progress; owner acceptance pending; no store submission |
| 2.0 b3 | 2.0.0.3 | 2026-11-07 | Identity-safe discovery, bidirectional lazy scan, alignment/gap, G/1/2, nested return and current-image exit | Developer QA in progress; no store submission |
| 2.0 b4 | 2.0.0.4 | 2026-11-08 | Active-image and overview-center return; stable root scroll lock; pointer-follow divider handle; independent automatic/custom overview thumbnail caches | Developer QA partial; owner final acceptance pending; no store submission |
| 2.0 b5 | 2.0.0.5 | 2026-11-09 | Stable thumbnail selection and delayed layout, independent 25–300% thumbnail size, toolbar controls, directional loading and return feedback | Developer fixture checks pass; live-site matrix incomplete; no store submission |
| 2.0 b6 | 2.0.0.6 | 2026-11-09 | Fixed 4:3 overview slots, decoded two-band buffers, proactive lazy discovery, persistent finite boundaries, mouse dragging and direct source exit | Source-only beta; generated-fixture QA recorded separately from pending live-site acceptance; no ZIP or store submission |
| 2.0 b7 | 2.0.0.7 | 2026-11-09 | Adaptive aspect-ratio masonry restored, reserved lazy rows discovered and filled, scanning tied to viewport demand, one silent initial before band | Source-only beta; no ZIP or store submission |
| 2.0 b8 | 2.0.0.8 | 2026-11-10 | Reconcile discovered cards in the active overview, bound unconfirmed placeholders, scan before thumbnail buffer runs out, improve layered image grouping | Source-only beta; no ZIP or store submission |
| 2.0 b9 | 2.0.0.9 | 2026-11-10 | Release pointer state across mode changes, exit directly at the source position, and bound directional lazy scan waits | Source-only beta; live-site matrix incomplete; no ZIP or store submission |
| 2.0 b10 | 2.0.0.10 | 2026-11-10 | Restore the source-image shrink cue and highlight on direct exit from image and overview modes | Source-fixture visual check passed; installed extension build not refreshed; no ZIP or store submission |
| 2.0 b11 | 2.0.0.11 | 2026-11-11 | Keep large repeated-row galleries in scope; simplify overview controls and organize settings | Generic 245-image fixture and local UI checked; installed-extension and real-site acceptance pending; no ZIP or store submission |
| 2.0 b13 | 2.0.0.13 | 2026-11-12 | Index visible cards and limit thumbnail updates to the nearby cache; retain a bounded recent thumbnail set | Source fixture and 81 automated checks; installed and live-site performance acceptance pending; no ZIP or store submission |
| 2.0 b12 | 2.0.0.12 | 2026-11-11 | Group settings into four tabs, refresh controls, reuse discovery work within each collection | 78 automated checks pass; Codex in-app browser visually confirms four tabs and generic function icons; source fixtures cover German text, keyboard tab navigation, 80-image two-way overview and nested delayed growth from 5 to 18 without a recommendation card. Live-site acceptance has not passed: one observed gallery mixed in related illustrations and required a page control to reveal more images. Final-source 20-site/15-structure matrix, installed extension manifest-version verification, 11-locale rendered layout sweep, and controlled before/after performance comparison remain incomplete. No ZIP or store submission. |

## b1

Package: `Imageseec-v2.0-b1.zip`, 32 files, 78,138 bytes.

SHA-256: `bd5b5321f6e02d71c27309ebb38b6593ded7ee71936e59df1d9600a4b22d5324`.

Validation: 45 automated checks pass; options syntax, public-source audit, ZIP integrity and packaged-file equality pass. No new browser interaction sweep was performed for this version-label change. The installed browser instance has not yet been reloaded and checked for the b1 label. The GitHub main branch still points to the previous 1.5.2 release revision; beta source and graph synchronization remain pending. Tests and public-source review are development evidence, not owner acceptance.

## b2

Package: `Imageseec-v2.0-b2.zip`, 32 files, 80,858 bytes. SHA-256: `a072f18fd08f2311581e40d342e4177524f96e93d46b878e3bec4517c0c552b7`. Installed isolated Chromium settings display **2.0 b2**. All 46 automated checks pass. The release remains pending final site acceptance and owner approval.

Future changed source deliveries must increment both the visible beta number and Chrome numeric version and update this record. Packaging belongs to the later release phase and requires a frozen source revision. The store workflow remains gated by [owner acceptance](RELEASE.md).

## b3

Package: `Imageseec-v2.0-b3.zip`, 32 files, 88,692 bytes. SHA-256: `92b23fa10d63994ccb718ebc74d408f7f3d831549932a97cebda4cec46481229`.

52 automated checks pass. The installed generated-gallery suite passes 25/25. Twenty live sites each have 25 installed handler checks (500 checks); image entry and one navigation key use trusted browser input, while gesture/wheel assertions are synthetic. Exact final dynamic-growth coverage and the 15-pattern acceptance matrix remain incomplete. A finite lazy chapter reached 18/18 without recommendations; current source-position return and nested bidirectional scanning were checked separately. Native context-menu selection remains unverified because the current in-app browser does not expose that menu. No owner acceptance or store submission.

The public graph contains generic source and tests only. Private site receipts and screenshots are excluded from the repository and package.

## b4

Package: `Imageseec-v2.0-b4.zip`, 32 files, 91,033 bytes. SHA-256: `892eb1fba388de898b5b413582085e2aa26e9904905d4a4cf3c3aa80d3ab2527`.

55 automated checks pass; the public-source audit covers 113 project files. In the Codex in-app browser, a generated 80-image gallery returned to the opened image after long browsing, the overview returned to its central image, the divider handle followed pointer Y and hid on leave, and lazy scanning kept the modal/root scroll lock stable. Automatic and custom thumbnail windows were checked separately. The broader live-site matrix and owner acceptance remain pending. Google Web Store is unchanged.

## b5

Package: `Imageseec-v2.0-b5.zip`, 32 files, 98,071 bytes. SHA-256: `db3dde68cb158a0c6dd91e0313ffff3a0c2d0d9e92cadb426b2583cd6327397d`.

57 unit checks and the 80-image installed development-extension fixture pass. Native browser input completed 101/101 thumbnail selections during repeated source refresh. The ZIP was checked for integrity and equality with the checkout. The installed fixture used the unpacked development extension in the in-app browser; a separate ZIP installation and the 20-site compatibility matrix are still pending. No owner acceptance or store submission.

## b6

Source-only beta on `beta/2.0-b6`. No ZIP was created, uploaded or submitted for review.

The 80-image delayed-source comparison exposed the b5 ratio-driven reflow. Fixed slots retained order and geometry through decode and reversing scroll. The unpacked development extension was exercised in the Codex in-app browser: actual vertical/horizontal mouse dragging, decoded buffers of 12 before and 12 after in six-column layout, proactive slow unknown-total discovery while overview scroll stayed at zero, and nested virtual source restoration. B6 results and remaining acceptance work are listed in [verification status](STATUS.zh-CN.md). Older real-site results do not count as b6 passes.

## b7

Restores aspect-ratio masonry and preserves each assigned lane when a delayed image supplies its true ratio. Group discovery now includes repeated rows with unloaded peer cards. Automatic cache starts with one silent preceding band and expands to two after backward input; custom counts stay independent. See the [current verification brief](STATUS.zh-CN.md).
