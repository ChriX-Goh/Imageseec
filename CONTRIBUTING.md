# Development

The source repository includes test fixtures and release-preparation documents. None are required for normal extension use. Product descriptions and release ZIPs must not contain local test addresses or workstation instructions.

Use Node.js 22+ for checks and Python 3.10+ for packaging:

```sh
node --test tests/unit.cjs
node tests/public-audit.cjs
python tests/package.py
```

The ZIP is created under `dist/` from an explicit runtime-file allowlist. Test fixtures, local backups, local screenshots and contributor documents are excluded. Building a ZIP is not evidence of store approval.

To run isolated interaction checks:

```sh
node tests/dev-server.cjs
```

Open the loopback address printed by that process. The server binds only to loopback and disables real fullscreen. Its images are generated test assets. The fixture models Chrome's storage, internationalization and runtime APIs; unit checks cover API routing separately. Test the installed extension in Chrome before a store release.

The gallery engine is structural. Use standards-based semantics, repeated image cards, explicit source relationships and provider-independent proxy patterns. Do not add domain dispatch, provider-specific selectors, original-filename guesses or captured account material. Examples should use reserved example domains and generated images.

Optional icon regeneration uses the development-only `sharp` package:

```sh
npm install --no-save --package-lock=false sharp
node tests/build-icons.cjs
```

Release notes and preparation: [release checklist](docs/RELEASE.md), [store copy](docs/STORE-LISTING.md), [verification record](tests/QA.md).
