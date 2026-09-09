# Watch Better Privacy Policy

Updated September 9, 2026. This policy describes the public release candidate in this repository. Public email services are not deployed until the release gates are completed.

## Email access

We ask for an email address and a verification code to unlock the extension. Supabase Auth handles the account and sign-in; Resend delivers transactional codes from `login@auth.syncmedia.shop`. These services process the email, authentication events and technical connection metadata needed to provide and protect the service. We do not use the email for marketing or sell it.

The extension remembers its verified login and refresh credentials in local Chrome extension storage restricted to trusted extension contexts. They are not synced and are not provided to YouTube webpage scripts. A previously verified device may retain access during a service outage for up to seven days after its last successful online verification. A detected revoked session is locked.

## Video information and AI

On enabled, verified YouTube pages, Watch Better reads video identifiers, titles, URLs and available captions to provide transcripts, search, navigation and Smart Skip. Captions may be prefetched for the currently watched video. Quick Learn requests another video's captions after its button is pressed. We do not collect general browsing history, download videos, upload thumbnails to AI, or read the clipboard. Copying selected captions writes to the clipboard only when requested.

Opening embedded Ask or Quick Learn shares bounded transcript context with the selected signed-in ChatGPT or Gemini service. Follow-up questions are sent when you submit them. Providers receive normal browser/network/session information and apply their own account, retention and usage policies. Watch Better does not read or store provider cookies, passwords or web-session tokens. Embedded sessions may remain loaded while you switch extension tabs.

Personal API fallback is optional. After an explicit endpoint permission grant, requested prompts, bounded captions and recent conversation context are sent directly from the extension background to that endpoint. The key authenticates those requests. Custom endpoint operators receive the key and supplied content; select only an endpoint you trust. API usage charges and provider retention rules may apply. Watch Better has no AI proxy collecting these requests.

Smart Skip is experimental and off by default. Local analysis stays on the device. Starting deep scan explicitly sends caption chunks to the selected AI connection. API scans do not automatically retry failed paid requests.

## Device storage

Settings persist locally. Transcript caching is memory-only by default; the optional browser-session cache clears on browser exit or extension reload. Smart Skip maps use session storage. API conversation text remains in the open card's memory; external providers may retain their copies. API keys use trusted session storage by default and are forgotten when Chrome closes or the extension reloads. Remember stores the key locally on this device, never in sync storage. Disconnect removes it and requests removal of the optional endpoint permission. Local storage is not a hardware-encrypted credential vault.

No analytics, advertising trackers or remote executable code are included. Temporary provider-frame rules apply only to prepared YouTube tabs, YouTube-initiated provider subframes, and the selected provider. They are cleaned up when sessions/tabs are reset or access is removed.

## Controls and deletion

Privacy, support, extension disable controls, sign-out and account management remain reachable without full feature access. Sign-out clears this device's extension account/API credentials and session caches; it does not sign you out of ChatGPT or Gemini. Delete account in extension settings removes the Supabase account after online verification and clears local access. Service delivery/security logs and provider-held conversations are governed by those services' retention policies; deleting this account does not delete your provider accounts or their histories. Uninstalling clears extension storage but does not delete a server-side account. Use Delete account first if desired.

For support, [open an issue](https://github.com/wasely/chrome-extentions/issues) without posting your email, codes, API keys or private content. See [security reporting](SECURITY.md) for sensitive reports.

Service policies: [Supabase](https://supabase.com/privacy), [Resend](https://resend.com/legal/privacy-policy), [OpenAI](https://openai.com/policies/privacy-policy/), [Google](https://policies.google.com/privacy). A custom API provider has its own policy.
