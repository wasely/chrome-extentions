# Final release review — September 9, 2026

Decision: not submitted. The public candidate and local preview have different signup behavior. The owner's local UI approval does not verify the public collector.

## Fixed during review

The extension's GitHub privacy/support links returned 404. Static privacy and help pages now run on the existing free Cloudflare Worker, independently of the signup service. Extension links and the listing packet use these pages. They expose no signup data and require no new domain or always-on PC. The optional inaccessible GitHub homepage is omitted from the listing.

## Evidence

- Public privacy and support: HTTPS 200, HTML content and security headers; browser inspected.
- Collector health: HTTP 200, configured false. No restricted GitHub key is installed.
- Store dashboard: Google account chooser, signed out. GitHub key-creation page: signed out.
- Source validation: 304 tests, strict TypeScript, lint, formatting and production build passed before this review; rerun for the updated links is recorded in VALIDATION.md.
- Nine collector tests pass, including public-document isolation; dependency audit reports zero vulnerabilities.
- Listing draft, permissions and privacy disclosures reviewed against the manifest and current data flow. Smart Skip remains experimental/off. No mobile Chrome support is claimed.

## Remaining blockers

1. Install a repo-restricted GitHub Issues key in the Worker; verify hosted signup, retry and deletion with synthetic data.
2. Test the public package installed in Chrome, including restart persistence, captions, SPA navigation, real AI answers and cleanup. Existing fixture tests cannot establish these results.
3. Complete the remaining platform/provider checks and actual store screenshots/promotional tile.
4. Sign into the verified store publisher session and complete the dashboard fields. Submit only after the documented release gates pass.

The current ZIP is a review candidate, not a release-ready upload. No review submission or publication was performed.
