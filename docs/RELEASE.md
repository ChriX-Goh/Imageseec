# Release preparation

## Account and store setup

1. Register a Chrome Web Store developer account and pay the one-time registration fee shown by Google. Google's official Chromium announcement states a US$5 registration fee; the dashboard is authoritative for the amount charged.
2. Enable Google Account 2-Step Verification, verify the contact email, and choose the public publisher name. Complete any identity or trader-status steps required by the current dashboard for the selected distribution regions.
3. The 11 supported UI languages are recorded in `docs/LOCALIZATION.md`; `en` is the default. Test unsupported-browser-language fallback and the actual installed extension. Store listing translations are a separate task.
4. MIT is selected; preserve `LICENSE` and attribution in releases. The source repository is currently private.

## Package and listing

- Run the unit checks, inspect the actual installed Chrome build, and run the public-file audit.
- Build the allowlisted ZIP using `python tests/package.py`; inspect the archive contents.
- Prepare the store title, short description, detailed description and localized listings.
- Prepare a 128 × 128 PNG icon (Google recommends 96 × 96 artwork with transparent padding for square icons) and at least one actual product screenshot at 1280 × 800 or 640 × 400. Optional promotional sizes are 440 × 280 and 1400 × 560. Recheck the current dashboard before producing final artwork; the current development screenshots are not final store assets.
- Publish a stable, public HTTPS privacy-policy URL. A policy file in a private repository is not a publicly readable policy page.
- Set a support URL, distribution regions, visibility and test instructions. Reviewers should be able to try the basic viewer without a third-party account; use a public image gallery or synthetic test page.
- Complete single-purpose, permission, data-handling and remote-code declarations. Keep the broad HTTP/HTTPS host permission explanation tied to Ctrl-click activation. Do not promise universal compatibility.
- Upload the ZIP as a new draft item, complete all required fields, and submit for review only when the account owner approves the final listing and package. Deferred publishing can keep an approved build from going live immediately.

## Expected effort

This is a conventional Manifest V3 extension with a single viewing purpose, no developer backend and no remote executable code. Those are useful starting points, not a guarantee of approval. The main preparation work is installed-browser QA, localization, accurate privacy disclosures and polished screenshots. Broad host permissions can lengthen review. Google says most reviews finish in a few days, but some take a few weeks.

## Official references

- [Developer registration](https://developer.chrome.com/docs/webstore/register/)
- [Registration fee announcement](https://blog.chromium.org/2020/03/new-developer-dashboard-and.html)
- [Account setup](https://developer.chrome.com/docs/webstore/set-up-account)
- [2-Step Verification](https://developer.chrome.com/docs/webstore/program-policies/two-step-verification)
- [Prepare images](https://developer.chrome.com/docs/webstore/images)
- [Privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)
- [Publish a draft and submit](https://developer.chrome.com/docs/webstore/publish)
- [Review process](https://developer.chrome.com/docs/webstore/review-process)

Checked October 30, 2026. Dashboard requirements and policies can change.
