# Verification record

## Current source: 2.0 b6

Earlier sections are historical; none of their real-site counts establish b6 acceptance. Current status is maintained in [the b6 brief](../docs/STATUS.zh-CN.md). This delivery contains source and graph updates only, with no ZIP and no store action.

61 unit checks pass. The Codex in-app browser's unpacked development extension passes 29 installed handler checks; real mouse input separately covers vertical/horizontal overview dragging and direct Escape exit. An 80-image fixed-grid fixture kept positions through delayed decoding; prepend anchor drift was approximately 0.16px. Six-column view loaded and decoded 12 thumbnails on each side outside the viewport. Slow unknown-total discovery grew ahead without scrolling the overview to its end; nested virtual return remounted the selected source within the 15% tolerance. The final-source 20-site/15-pattern matrix is still incomplete. Private site records and screenshots remain excluded from Git.

## 2.0 implementation checks

- Automated unit checks cover all 11 localized catalogs, the 2.0 settings bounds, common `data-srcset` and CSS background URLs, mixed-tag repeated cards, nested gallery rows, detail-link image URL parameters, source de-duplication, and extension entry routes. Current result: 45 passing. The first numbered beta is 2.0 b1 (Chrome version 2.0.0.1); older evidence predates this numbering.
- The private installed-extension matrix now covers 20 distinct public gallery sites and 20 observed structure/source/loading combinations (one site per combination), meeting the plan's numeric threshold. Some planned candidates hit network or bot interstitials and remain untested; they were not counted. Names and screenshots stay outside public product materials.
- The overview scanner only adds images from the detected gallery scope. It does not fall back to unrelated page images. In Codex's isolated Chromium, the unpacked 2.0 extension was installed and tested across 20 public galleries. Counts ranged from small carousels and result groups to 145-item comic lists. A visual-search result grid grew from 5 to 35 after a generic nested-row/detail-link fix; pair navigation advanced 1/2 → 3/4 and overview showed the detected set. The private matrix records the site-level evidence.
- On the 20 live pages, the repeated checks were image grouping, pair opening, adjacent navigation and overview discovery. Lock behavior, divider limits/reset and synchronized gestures were checked separately in a generated-gallery runtime fixture; lazy scanning and scroll restoration were checked in the installed-extension fixture. The full interaction sweep has not yet been repeated on every live site.
- Follow-up in a fresh isolated Chromium checked one representative live gallery end-to-end: pair navigation, left-pane lock across keyboard and button navigation, divider drag to the 33% bound and double-click reset to 50%, synchronized held zoom (1 → 2.2 → 1), synchronized Alt-drag (55 × 23 CSS pixels), overview selection, and return to the selected pair. This supplements but does not replace repeating the interaction sweep on every matrix site.
- Codex's in-app browser also loaded the actual viewer source through the test-only Chrome API shim. With a generated gallery it verified: default pair advance 1/2 → 3/4; one-image advance 1/2 → 2/3; a locked left pane stayed fixed while the right advanced; the divider moved, stopped at the configured one-third minimum and reset on double-click; Escape returned from overview to the previous 2/3 pair; selecting image 8 returned to 8/9. The overview's virtual gallery scanner grew the nested gallery from 6 to 30 generated cards, assigned thumbnail sources to 25 cards (19 visible plus the configured 6-card buffer), and restored nested `scrollTop` from 60 to 60. Fullscreen remained disabled by the shim. This is runtime evidence for the viewer in an in-app Chromium page, not proof that an installed extension runs in Chrome or on any real site.
- In the same in-app browser fixture, held-click magnification changed both equal-sized comparison images from scale 0.333333 (100%) to 0.666667 (200%); dragging moved both to the same translated coordinates, and release restored both to 100%. The Alt-drag fixture moved both panes by `(100px, 50px)` while keeping their scales equal. The single/dual-view choice persisted after closing and reopening the viewer.
- A mixed-size pair (1920 × 1080 and 320 × 200) kept its own fit scales during synchronized gestures: Alt-drag moved both by `(100px, 50px)` while scales remained `0.333333` and `1`; held-click raised them to `0.666667` and `2` with the corresponding in-image position mapped between panes, then restored each image's prior fit and pan on release.

## 2.0 isolated installed-extension checks

- A real gallery page opened 94 images and advanced as a pair from 1/2 to 3/4. A second page opened 24 images. A visual-search page opened 35 after generic support for nested repeated rows and image URLs carried by detail links; its overview listed those 35 results.
- The installed extension on the nested-scroll lazy-load fixture discovered 6 initial images, triggered dynamic additions until 30 were present, opened the last overview item at 30/30, and restored the original nested and document scroll positions on close.
- Network errors and bot interstitials are recorded as untested. The numeric 20-site / 15-pattern compatibility threshold is met; the complete per-site interaction sweep remains before publication.

## 1.5.0 structural gallery discovery

- Regression checks cover responsive image variants, domain-independent image proxies, semantic galleries, repeated sibling cards, explicit original-image relationships and standard ARIA ordering.
- Background-gallery matching from a modal requires an explicit image-source relationship. Unmatched hidden albums remain excluded. DOM order is preserved when a complete ARIA sequence is unavailable.
- Original image filenames are never guessed; only webpage-supplied image URLs are requested. Site identity is not used for gallery selection or source resolution.
- Product documentation contains no local test addresses. Development instructions are maintained separately and are not included in extension ZIPs.
- In the isolated structural fixture, Ctrl-clicking an original image in a native modal reconnects to three ordinary sibling figures using an explicit full-image attribute, excludes the modal's unrelated reference image, and opens 2 / 3. The next button opens the portrait at 3 / 3; ArrowLeft returns to 2 / 3. This works with no gallery class or custom ordering attributes and makes zero real fullscreen requests. Chrome API behavior is simulated; this is not a claim about every website.

## 1.4.0 localization and MIT

- All 31 automated checks pass, including all 11 complete catalogs, named-placeholder consistency, UI language resolution, unsupported-language English fallback and template escaping.
- Browser fixture checks render settings in all 11 languages plus unsupported Swedish. All settings labels and footer buttons fit without horizontal overflow at the 340px panel width. Russian, Ukrainian and Polish text render correctly.
- A fresh Ukrainian Ctrl-click entry opens the second image directly, shows the localized image count, keeps a 320 × 200 image at its natural dimensions and makes zero real fullscreen requests.
- Changing temporary magnification to 225 saves immediately and persists when reopening. Arrow navigation updates the Ukrainian image count. Website-provided captions remain unchanged.
- The fixture uses actual extension code with a model of Chrome's i18n/storage/runtime APIs. It does not change the user's browser language or reload their installed extension. Native Chrome locale selection and store-installed behavior remain release checks.
- `LICENSE` contains MIT and is included in the ZIP. No host permissions were added by localization; catalogs and executable code ship locally.

The project includes automated tests for settings normalization, zoom-ruler mapping, temporary magnification movement, gallery URL handling and grouping, extension resources, frame routing, fallback viewing, and Ctrl-click activation.

## Interaction verification

The isolated browser fixture has been used to check aspect-ratio fitting, initial small-image sizing, image navigation, thumbnail previews, settings persistence, zoom presets and locking, temporary magnification, free panning, and popup dismissal.

Observed examples:

- 320 × 200 images initially remain 320 × 200.
- A custom 50% view cycles through viewport fit, 100%, and back to 50%.
- At 200% temporary magnification, a pointer delta of (460, 260) produces a pan delta of (-920, -520); release restores the earlier scale and position.
- Alt-drag keeps scale unchanged and retains its final position.
- Keyboard image navigation hides edge-preview thumbnails; pointer hover restores them.
- The zoom ruler uses 0 / 25 / 50 / 75 / 100 with a dynamic yellow upper endpoint of 150 / 200 / 300 / 500.

## Limits of this evidence

Generated-image fixtures that use simulated Chrome APIs do not establish installed-extension compatibility. The private matrix's initial 20-site discovery threshold is met, while its full per-site interaction sweep remains outstanding. Sixteen private site receipts each record all 14 interaction checks passing; a seventeenth has separate corrected divider geometry measurements and retains its original partial suite receipt. These receipts were collected during iterative fixes, and do not establish a complete final-source sweep.

The installed in-app extension was also verified against transparent card overlays, ancestor background textures, and transparent one-pixel placeholders. A generated regression fixture opened the real second and third images as a pair and excluded the placeholder. Thumbnail dimension changes now schedule another viewport/buffer calculation; the affected live gallery passed its repeat sweep. Fresh-page resident entry after the user reloaded the extension was verified. Automated checks total 45 passes. Serious in-app browser call timeouts interrupted further verification; no host browser was launched as a substitute. Real fullscreen was not exercised. Store listing materials and the final-source site sweep remain release checks.


## 2.0 b2 overview regression

- `tests/unit.cjs` checks layout ordering, cross-axis containment and preservation of image aspect ratios for both directions and the borderless presentation. The suite has 46 passing checks, including 11 complete catalogs.
- In an installed isolated browser, the default overview packs thumbnails left to right within each row. Horizontal overview packs top to bottom within each column and scrolls only horizontally. The clean option removes visible thumbnail borders and captions and retains accessible labels. The new preferences persist after reopening.
- In the nested lazy fixture, horizontal overview expanded the gallery from 6 to 30 cards. Closing normally or interrupting scanning restored the original document and nested offsets (720 and 190 CSS pixels).
- `tests/installed-checks.js` is a test function evaluated in the installed extension's isolated content-script world after opening a gallery. It uses synthetic events to check handler logic, and Chrome storage to test preferences. Native keyboard, pointer, wheel and activation paths require independent browser input. Site lists, raw captures and site-specific traces are private and do not enter the package.

## 2.0 b3 current-source fixture checks

- On 2026-11-07, Codex's in-app browser loaded the current b3 viewer code in the generated-gallery fixture at a 1440 × 900 CSS viewport. This page uses the test-only Chrome API shim and is not an installed-extension or live-site result.
- Real browser input verified G toggles overview and back; selecting image 8 opens 8/9; Esc from the image returns to overview and a second Esc restores the earlier 5/6 pair; double-clicking the image returns to overview; 1/2 switches single/compare modes.
- The settings panel showed vertical browsing, automatic alignment, a 12 px image gap, a 6-image thumbnail buffer and all 11 language choices.
- Closing from overview returned to the generated page. All nine cards fit in the tested viewport, so this does not validate deep-page scroll restoration.
- The final-source 20-site interaction sweep, installed-extension dynamic-growth checks, and native context-menu selection remain incomplete.
