# Publication review

A new source repository is being prepared without historical development backups or personal workstation documentation.

- Replaced local installation paths with relative instructions.
- Removed workstation-specific dependency paths from the optional icon builder.
- Replaced historical private-gallery counts and operator/tool logs with a generic verification record.
- Kept historical originals locally in ignored directories; they are not staged or included in runtime ZIPs.
- Excluded generated development screenshots, archives, signing keys, environment files and local dependencies through `.gitignore`.
- Runtime code contains no developer credentials. Gallery URLs and signed-link tokens are processed dynamically; no captured account URLs are required in fixtures.
- Only `icons/` PNG assets are included in the initial source repository. They are generated from the bundled vector recipe; no private gallery images are included.
- Git commit author metadata should use a project name and a GitHub no-reply email, not the workstation's personal email configuration.
- `node tests/public-audit.cjs` checks the exact tracked file set for common local paths, credential formats and excluded artifacts. This is a bounded check, not a guarantee against every possible secret format.

The public repository owner and repository URL necessarily identify the chosen GitHub account. Redaction of local files does not anonymize ownership of a GitHub repository.
