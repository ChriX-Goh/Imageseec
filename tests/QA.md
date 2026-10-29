# Verification record

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

The fixture uses generated images and simulated Chrome APIs. Unit tests cover API routing separately. These checks do not replace testing an installed extension in Chrome, nor establish compatibility with every website. Real browser fullscreen is deliberately disabled in the fixture. Store listing materials must use fresh screenshots of the release being submitted.
