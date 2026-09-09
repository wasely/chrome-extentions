# Chrome extensions

[Watch Better](extensions/watch-better) adds captions, transcript search, timestamp navigation, AI questions, Quick Learn, and experimental Smart Skip to desktop YouTube.

This is the separate public release source. **Chrome Web Store submission is blocked until live email delivery and browser release checks pass.** There is no public store listing yet.

- English defaults. Smart Skip starts off and recommends staying off while in development.
- Email and a six-digit code unlock access; no password or subscription.
- Embedded ChatGPT/Gemini, with optional personal Gemini or OpenAI-compatible API access.
- Supabase Auth and Resend configuration for `auth.syncmedia.shop`; free plans only.

See [setup](extensions/watch-better/README.md), [privacy](extensions/watch-better/PRIVACY.md), and [release status](extensions/watch-better/docs/RELEASE_STATUS.md). Target: desktop Chrome 133+; mobile Chrome cannot install this extension. Cross-OS live testing remains pending.

```powershell
cd extensions/watch-better
npm ci
npm run validate
```

[Report a bug](https://github.com/wasely/chrome-extentions/issues). Please remove account details, API keys, and private video information from reports.
