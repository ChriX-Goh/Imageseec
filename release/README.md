# Imageseec store submission files

- `listing/`: English titles, summaries and descriptions for all 11 supported locales; full descriptions in English, Simplified Chinese and the remaining nine locales.
- `assets/`: store icon, optional promotional art and desktop product screenshots. Screenshots must come from the final 2.0 build and use generated or author-owned imagery without third-party site branding.
- `reviewer-instructions.txt`: account-free feature review steps.
- `web/privacy.html`: generated mirror of the canonical policy in the repository root, `PRIVACY.md`.
- `../dist/Imageseec-v2.0-b2.zip`: numbered local beta generated from the runtime allowlist. Final-source interaction QA and the owner's final acceptance remain outstanding. See `../docs/BUILDS.md`.

The 20-site compatibility matrix and its evidence stay outside the public repository and these listing files. Do not include site identities, private image URLs, login states or account details in screenshots or store copy.

Build the ZIP with `python tests/package.py`. GitHub may receive clearly marked test builds. Do not upload, submit for review or publish on the Chrome Web Store before the owner has accepted the exact build and explicitly authorized submission. The eventual store package and GitHub source must use the same verified revision.
