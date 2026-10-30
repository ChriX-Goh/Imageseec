# Imageseec store submission files

- `listing/`: detailed descriptions, titles and summaries in English, Simplified Chinese, Traditional Chinese (Taiwan), Japanese, Korean, German, French, Spanish, Russian, Ukrainian and Polish.
- `assets/`: store icon, optional promo art and two manually reviewed desktop product screenshots at 1280 × 800.
- `reviewer-instructions.txt`: test steps that require no account or credentials.
- `web/privacy.html`: generated mirror of the canonical policy in the repository root, `PRIVACY.md`.
- `../dist/Imageseec-v1.5.2.zip`: the extension package generated from the runtime allowlist; version 1.5.2 is uploaded to the store draft.

The draft contains the screenshots and localized descriptions. Its selected distribution is free, public and all regions. The home and privacy links point to the main repository, which is still private; the dashboard cannot verify those links until the repository is made public.

Before submission, the account owner must review the privacy and permission disclosures and confirm they are accurate. The owner must also choose whether an approved item publishes automatically or remains deferred.

Build the ZIP with `python tests/package.py`. Product copy and screenshots use generic gallery examples and do not name or brand specific websites. The viewer discovers adjacent images from common page structures; compatibility varies.
