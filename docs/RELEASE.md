# Chrome Web Store release

## Prepared package

- Manifest version: `1.5.2`.
- Extension UI: 11 locales, with English as the fallback. The language can follow Chrome or be selected in settings.
- Store copy: detailed descriptions, titles and summaries are prepared for all 11 package locales in `release/listing/`.
- Product screenshots: the English localized slot and global slot each contain a 1280 × 800, 24-bit PNG desktop-viewer screenshot without third-party site branding.
- Privacy policy: [`PRIVACY.md`](../PRIVACY.md), included in the main repository. The store draft points to the public GitHub file URL.
- Reviewer steps: `release/reviewer-instructions.txt`; no account or credentials are needed.

## Dashboard handoff

The developer account, registration payment, contact-email verification and 2-Step Verification are complete. The existing store draft now contains package version 1.5.2, screenshots and localized descriptions.

The selected distribution is free, public and all regions. The main repository is currently private, so the dashboard cannot yet verify either the homepage or privacy-policy URL. Those URLs point to the main repository and will become accessible when the repository is public.

Before review, the account owner must inspect the privacy and permission disclosures and certify that they are accurate. The dashboard already discloses locally processed website content and browsing activity, with remote code set to No. The account owner must also choose whether approval should publish automatically or be deferred.

## Build and release

Build the allowlisted extension ZIP with:

```sh
python tests/package.py
```

The ZIP includes only extension runtime files, locale catalogs, icons, the README and privacy policy. Store screenshots and promo art remain in the repository for future listing updates but are not included in the extension package. Test fixtures and local development helpers are excluded from the ZIP.

Broad HTTP/HTTPS host access is used for the optional Ctrl-click entry point; explain it accurately in the permission field. Gallery discovery and preloading begin only after a user opens the viewer. Compatibility is heuristic and must not be promised for every website.

## Official references

- [Complete the store listing and localize it](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)
- [Screenshot and promotional asset guidance](https://developer.chrome.com/docs/webstore/best-listing)
- [Privacy practices](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)
- [User data FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
- [Submit an item for review](https://developer.chrome.com/docs/webstore/publish)
- [Review process](https://developer.chrome.com/docs/webstore/review-process)

Checked October 31, 2026. Dashboard requirements can change.
