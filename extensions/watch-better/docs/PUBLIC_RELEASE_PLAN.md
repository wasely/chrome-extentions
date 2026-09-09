# Public release implementation plan

The approved plan is being implemented in this separate repository. [Release status](RELEASE_STATUS.md) is the current source of truth.

1. Preserve the development checkout; prepare public source in wasely/chrome-extentions.
2. Finish English defaults and caption preference. Smart Skip stays off with a development warning.
3. Add email-code access using Supabase Auth and Resend on auth.syncmedia.shop, remembered verification, offline grace, logout and verified account deletion.
4. Retain embedded ChatGPT/Gemini and add explicit optional personal Gemini/OpenAI-compatible API configuration, exact-host grants, trusted session/local key storage, streaming, cancellation and bounded context.
5. Integrate API deep scan without paid automatic retries. Preserve existing interval and playback safeguards.
6. Reduce duplicate scans and clean up work on navigation/disposal; test isolated cards, captions, settings, authentication and privilege boundaries.
7. Inspect dark/light and narrow/wide UI, validate source/build, scan for secrets, create the public GitHub repository and three-OS CI.
8. Configure actual free email services and DNS; verify real delivery, deletion, clean install, signed-in providers, optional API providers, YouTube lifecycle and desktop platforms.
9. Produce final screenshots, disclosure/reviewer packet and gated store ZIP. Submit only after the live release gates pass.

Steps requiring signed-in service accounts and real provider sessions remain pending. No paid infrastructure upgrades are authorized.
