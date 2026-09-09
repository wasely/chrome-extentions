# Watch Better 1.0.2 candidate

Status: **not ready to submit**. Public source and local candidate builds are for review; they are not an approved store release.

## Implemented

- English UI, English caption preference with original/manual fallback, English AI instructions.
- Smart Skip disabled by default, legacy opt-in reset, persistent development warning.
- Explicit consent, private GitHub signup collection through a Cloudflare Worker, remembered access and receipt-authorized deletion. No verification mail, DNS, custom domain, or always-on PC.
- Previously local-only emails are not uploaded automatically. Legacy authentication is discarded. Supabase/Resend are not used.
- Trusted-only local/session storage, allowlisted content-script storage bridge, no account tokens or API keys sent to YouTube content scripts.
- Optional Gemini/OpenAI-compatible API, exact-host permission prompt, session keys by default, explicit local Remember, disconnect, model listing, connection test, streaming chat, bounded context, Stop, partial-answer preservation.
- API deep scan uses existing interval validation and does not retry automatically. Embedded providers remain available; API errors do not silently switch providers.
- Quick Learn mutation scans deduplicate nested roots and reject queued work after disposal.
- Desktop build, accessibility/unit/integration checks and a three-OS CI workflow.

## Required live gates

- [ ] Public GitHub accessibility: repository is created, API visibility is public, and the pushed commit is verified, but an unauthenticated browser currently receives 404. Privacy/support URLs must work publicly before submission.
- [ ] GitHub account Actions restriction: manual CI dispatch returned HTTP 422, "Actions has been disabled for this user." Repository Actions are enabled. Resolve the account restriction before running the three-OS workflow.
- [ ] Restricted GitHub Issues token installed as a Worker secret; live consented signup, retry deduplication, deletion and retention cleanup verified. Collector is deployed but currently unconfigured.
- [ ] Clean Chrome install: email entry without a code, restart persistence, removal/API cleanup, and re-entry.
- [ ] Signed-in ChatGPT and Gemini: actual transcript question, streamed answer, follow-up, two cards without cross-talk. Review frame-header rules against real provider behavior.
- [ ] Real Gemini and OpenAI-compatible API: exact-host permission, streaming, cancellation, quota/auth errors, deep-scan cancellation and session-key expiry.
- [ ] YouTube live captions/Shorts/SPA navigation/theater/fullscreen/200% zoom and unchanged playback speed.
- [ ] Desktop Windows/macOS/Linux/ChromeOS spot checks. CI is not a substitute for browser checks.
- [ ] Final screenshots, store disclosures, reviewer instructions and exact ZIP inspected.

`npm run package:store` refuses to proceed while recorded live evidence is missing. Mark evidence only after performing the check; email collection is unverified signup and must never be treated as verified identity.

The original development checkout is separate and was not edited for this public release.
