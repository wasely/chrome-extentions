# Candidate validation — September 9, 2026

## Current candidate: 1.0.3, inline onboarding and consistent UI

- `npm run validate` passed: formatting, lint, strict TypeScript, **46 files / 304 tests**, production build. The candidate ZIP was inspected: full-tab options, current collector host, no local-preview bypass, server credentials, source maps or environment files.

- Signup uses one email field and Enter, with collection consent disclosed beside the field. The actual presentation component sits inert and blurred behind it; the protected runtime and AI frames remain unmounted until access succeeds.
- Top-frame YouTube content scripts can submit a consented signup; the response never returns the saved email. Deletion and private API management remain restricted to extension pages.
- Browser fixture checks: Enter unlocks, reload preserves access, removal restores the gate. Dark wide and light narrow views inspected. Fixture collection is synthetic, not proof of hosted collection.
- Settings use the same icon and neutral controls, one layout, a compact saved-account row, and a full Chrome tab.
- The owner's existing `.output/local-test-1.0.1` folder is updated separately with the UI and a clearly labeled **1.0.3 local preview**. It retains local-only email storage, including an already-entered email; it is not the public collection candidate and must not be submitted.
- Hosted collection and all unperformed release gates remain pending. No production bypass is included.

### Popup polish follow-up

The toolbar popup has consistent outer padding, an inset status row, a bordered settings button, and a smaller toggle. Hover changes color without shifting controls. Dark wide and light narrow fixture screenshots were inspected; the same CSS is copied into the existing local preview.

## Prior candidate: 1.0.2, private email collection

Owner-approved scope now collects emails after an explicit checkbox through Cloudflare into private GitHub Issues. The private repo and deployed Worker exist. The collector reports unconfigured until a repo-restricted GitHub key is installed. It returns 503 for signup rather than falsely claiming collection.

- Backend tests cover private-only storage, consent, input size, origin/rate limits, idempotency, deletion and retention.
- Local fixture UI shows the collection disclosure and an unchecked consent checkbox. It never sends real email data.
- `npm run validate` passed: formatting, lint, strict TypeScript, **46 files / 303 tests**, production build.
- `npm run zip` produced the 1.0.2 candidate. Inspection confirmed the exact collector host and consent flow, with no GitHub API endpoint, server key, environment files, source maps, or backend code bundled.
- Eight backend tests passed. The deployed Worker health responds HTTP 200 with configured false; signup responds HTTP 503 until its restricted key is installed.
- A local real-GitHub smoke test created one synthetic example.com signup, retried without duplication, and deleted it. The private repo contains zero remaining issues. The local GitHub credential was never deployed to the Worker.
- Light 320px and dark 1000px fixture views inspected. Consent is unchecked by default; fixture submission reaches full access. These are not live installed-extension or hosted collection checks.
- Store packaging correctly remains blocked for the recorded live gates.

## Prior candidate: 1.0.1, local email entry (superseded)

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

## Final review follow-up

Updated extension privacy/support links to deployed public Cloudflare pages. Both return HTTP 200 and were inspected in the browser. The collector still reports configured false. Full validation passed again: 46 files / 304 tests, lint, formatting, strict TypeScript and build. Nine backend tests pass; npm audit reports zero vulnerabilities. The rebuilt candidate ZIP contains the new links and no local-preview bypass or server credential. The existing local-preview folder was updated separately. Store packaging still correctly rejects eight missing live gates. See FINAL_REVIEW.md.
