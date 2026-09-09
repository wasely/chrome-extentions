# Chrome Web Store packet — candidate

Do not submit until every gate in [release status](RELEASE_STATUS.md) is completed. Developer verification does not replace extension review.

## Listing draft

Name: **Watch Better**

Short description: **Read YouTube captions, find useful moments, and ask AI about videos. Includes optional experimental Smart Skip.**

Detailed description:

Watch Better brings a searchable transcript and AI questions alongside desktop YouTube. Find words, select and copy captions, and jump to useful timestamps. Open Quick Learn from a thumbnail or keep separate video cards on the page.

Enter your email, then its six-digit verification code for full extension access. No password or subscription. English is the default, with other available caption tracks selectable.

Ask uses your signed-in ChatGPT or Gemini session. Advanced users can optionally connect a personal Gemini or OpenAI-compatible API account. API providers may charge for usage. Your API key stays on your device and is forgotten when Chrome closes unless you select Remember.

Smart Skip is in development, starts off, and may skip useful content. We recommend keeping it turned off for now. It never changes your playback speed.

Requires desktop Chrome 133+ and available YouTube captions. Mobile Chrome is unsupported. AI providers can require sign-in, impose limits, or change their interfaces. Not affiliated with YouTube, Google or OpenAI.

## URLs and assets

- Support: https://github.com/wasely/chrome-extentions/issues
- Privacy: https://github.com/wasely/chrome-extentions/blob/main/extensions/watch-better/PRIVACY.md
- Homepage: https://github.com/wasely/chrome-extentions
- Icons: public/icon (16, 32, 48, 128 pixels).
- Final screenshots still required: actual transcript/search; actual AI answer with timestamps; email access/settings; Smart Skip development warning. Use 1280×800 or 640×400. Do not use fixture previews as evidence of a live feature.
- Promotional tile: 440×280. Create from the approved product UI after live checks.

## Permission explanations

- storage: device settings, verified access, optional personal API key and temporary transcript/Smart Skip caches. No sync storage.
- declarativeNetRequest: scoped header adjustments for explicitly opened embedded AI sessions. Restricted to the prepared tab, provider, and YouTube-initiated subframes. Review remaining header removals during live provider verification.
- webNavigation: bind and clean up embedded provider frames across navigation.
- YouTube host: captions, timestamp navigation and the isolated extension interface.
- ChatGPT/Gemini hosts: embedded signed-in AI workflow, invoked by the viewer.
- Exact Supabase project host: email verification, session refresh and account deletion.
- Optional HTTPS hosts: request only the exact endpoint the user selects in Advanced API settings. No broad host grant at install time.

## Privacy disclosures to review against the submitted build

Declare email/personal information, authentication information and website content (video titles/URLs/captions and prompts). Explain video URL handling in any browsing-data question; do not claim the extension processes no visited URLs. There are no ads or analytics. Keys are optional device-side credentials. User content may be sent to the chosen AI provider, and email is processed by Supabase/Resend. The complete policy must remain publicly reachable.

## Reviewer instructions

Install the final ZIP, open Options, and request a code using a reviewer-controlled email address. Enter the delivered code to unlock features. No password or paid Watch Better account is required. Open a captioned YouTube video to use transcripts. For embedded AI, sign into ChatGPT/Gemini through their normal pages when prompted. API fallback is optional and requires the reviewer's own provider key. Smart Skip is off; leave it off unless reviewing the experimental controls.

The email service must be operational for review. Do not send an expired OTP or add an authentication bypass. If the developer dashboard requests additional private testing instructions, supply those only after establishing working access.

Run `npm run package:store`, inspect the ZIP manifest and contents, then upload in the verified publisher account. Complete the privacy and distribution fields. Check the current dashboard requirements before submitting. No automatic submission or public-release claim is made by this repository.

References: [Chrome listing images](https://developer.chrome.com/docs/webstore/images), [publish your extension](https://developer.chrome.com/docs/webstore/publish), [privacy practices](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy).
