# Candidate validation — September 9, 2026

## Current candidate: 1.0.1, local email entry

Email verification and server deployment were removed at the owner's request. Email entry is now local onboarding, not verified identity. No domain, DNS, SMTP, environment values, or always-on PC are required. The entered email stays in trusted Chrome extension storage and is not sent to the publisher.

- Focused tests cover immediate unlock without network access, remembered access across service recreation, invalid/corrupt emails, removal, legacy credential cleanup, storage failure, and message privilege boundaries.
- BrowserOS fixture interaction: enter an email, Continue, full-access state, Remove email, return to entry. Real components and local access service with an in-memory browser-storage adapter; no email was sent.
- Screenshots inspected at light 320px and dark 1000px. Email controls and local-storage disclosure fit; no horizontal page overflow. No verification-code field remains.
- `npm run validate`: formatting, ESLint, strict TypeScript, **45 test files / 297 tests**, and production build passed.
- `npm run zip`: 1.0.1 review ZIP built and inspected. No old code endpoints, email-service hosts, environment files, source maps, tests, harness, or dependencies in the archive.
- `npm run release:check` remains blocked only by the recorded live release gates. No email-service configuration is required.

These fixture checks do not establish a clean installed Chrome flow, real provider compatibility, or cross-platform behavior. Live evidence remains false until those checks are performed. See [RELEASE_STATUS.md](RELEASE_STATUS.md).

## Prior candidate: 1.0.0 (superseded)

The previous verified-email candidate passed 46 test files / 292 tests, formatting, lint, strict TypeScript, and production build. Its 243,987-byte ZIP was only a review build. The email backend was never deployed. Those backend gates no longer apply to 1.0.1.

The previous dependency audit reported zero vulnerabilities after Vitest and coverage were patched to 4.1.11. This change adds no dependencies. Redacted history scanning found no leaks.

The GitHub repo was created as public, but the unauthenticated public URL returned 404. Manual CI dispatch returned HTTP 422: "Actions has been disabled for this user." No remote CI pass or public store release is claimed. Privacy/support URLs and the remaining live checks must work before submission.
