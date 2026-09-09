# Watch Better 1.0.0 candidate

Status: **not ready to submit**. Public source and local candidate builds are for review; they are not an approved store release.

## Implemented

- English UI, English caption preference with original/manual fallback, English AI instructions.
- Smart Skip disabled by default, legacy opt-in reset, persistent development warning.
- Email-code UI, confirmed-email enforcement, remembered login, seven-day offline grace after online verification, sign-out and account-deletion flow.
- Supabase Auth client in the background; Resend SMTP/code template and deletion function source.
- Trusted-only local/session storage, allowlisted content-script storage bridge, no account tokens or API keys sent to YouTube content scripts.
- Optional Gemini/OpenAI-compatible API, exact-host permission prompt, session keys by default, explicit local Remember, disconnect, model listing, connection test, streaming chat, bounded context, Stop, partial-answer preservation.
- API deep scan uses existing interval validation and does not retry automatically. Embedded providers remain available; API errors do not silently switch providers.
- Quick Learn mutation scans deduplicate nested roots and reject queued work after disposal.
- Desktop build, accessibility/unit/integration checks and a three-OS CI workflow.

## Required live gates

- [ ] Supabase and Resend account access, Free projects configured.
- [ ] Resend-generated DNS records added to `auth.syncmedia.shop` and verified.
- [ ] Custom SMTP and both OTP templates enabled. Real code delivery and invalid/expired-code checks.
- [ ] Public Supabase client values supplied to the build; deployed deletion function verified against a real account.
- [ ] Clean Chrome install, verify email, restart, logout/re-login, account deletion.
- [ ] Signed-in ChatGPT and Gemini: actual transcript question, streamed answer, follow-up, two cards without cross-talk. Review frame-header rules against real provider behavior.
- [ ] Real Gemini and OpenAI-compatible API: exact-host permission, streaming, cancellation, quota/auth errors, deep-scan cancellation and session-key expiry.
- [ ] YouTube live captions/Shorts/SPA navigation/theater/fullscreen/200% zoom and unchanged playback speed.
- [ ] Desktop Windows/macOS/Linux/ChromeOS spot checks. CI is not a substitute for browser checks.
- [ ] Final screenshots, store disclosures, reviewer instructions and exact ZIP inspected.

`npm run package:store` refuses to proceed while configuration or recorded live evidence is missing. Mark evidence only after performing the check; never enable an auth bypass for review or production.

The original development checkout is separate and was not edited for this public release.
