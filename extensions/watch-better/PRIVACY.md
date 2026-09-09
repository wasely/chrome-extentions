# Watch Better Privacy Policy

Updated September 9, 2026. This policy describes the public release candidate in this repository.

## Email access

We ask for an email address and your explicit agreement before sending it to Watch Better. The address travels over HTTPS through our Cloudflare Worker and is stored as a signup record in a private GitHub repository's Issues section. We store the normalized address, consent version, collection time, and deletion date. The address is not verified and does not prove identity. We do not sell it or use it for marketing. No verification emails are sent.

Cloudflare processes connection metadata, including IP addresses used for short-term rate limiting. We do not add IP addresses to signup records, enable Worker request logging, or send browsing content to this collector. Durable Objects hold request hashes and GitHub issue references for retry, deletion and retention; they do not persist the email itself. GitHub and Cloudflare also process service metadata under their own policies.

After the collector confirms storage, Chrome remembers access locally. The email and a random deletion receipt remain in extension storage restricted to trusted extension contexts, never sync storage or YouTube page scripts. Previously local-only emails are not uploaded automatically: users must agree again. The signup email and deletion receipt are never included in AI prompts.

Signup records are scheduled for deletion after 365 days, with daily retries if a provider outage prevents deletion. GitHub and Cloudflare may retain platform backups or security records under their own retention policies. The deletion receipt lets the original browser remove its signup without requiring email verification.

## Video information and AI

On enabled YouTube pages after email entry, Watch Better reads video identifiers, titles, URLs and available captions to provide transcripts, search, navigation and Smart Skip. Captions may be prefetched for the currently watched video. Quick Learn requests another video's captions after its button is pressed. We do not collect general browsing history, download videos, upload thumbnails to AI, or read the clipboard. Copying selected captions writes to the clipboard only when requested.

Opening embedded Ask or Quick Learn shares bounded transcript context with the selected signed-in ChatGPT or Gemini service. Follow-up questions are sent when you submit them. Providers receive normal browser/network/session information and apply their own account, retention and usage policies. Watch Better does not read or store provider cookies, passwords or web-session tokens. Embedded sessions may remain loaded while you switch extension tabs.

Personal API fallback is optional. After an explicit endpoint permission grant, requested prompts, bounded captions and recent conversation context are sent directly from the extension background to that endpoint. The key authenticates those requests. Custom endpoint operators receive the key and supplied content; select only an endpoint you trust. API usage charges and provider retention rules may apply. Watch Better has no AI proxy collecting these requests.

Smart Skip is experimental and off by default. Local analysis stays on the device. Starting deep scan explicitly sends caption chunks to the selected AI connection. API scans do not automatically retry failed paid requests.

## Device storage

Settings persist locally. Transcript caching is memory-only by default; the optional browser-session cache clears on browser exit or extension reload. Smart Skip maps use session storage. API conversation text remains in the open card's memory; external providers may retain their copies. API keys use trusted session storage by default and are forgotten when Chrome closes or the extension reloads. Remember stores the key locally on this device, never in sync storage. Disconnect removes it and requests removal of the optional endpoint permission. Local storage is not a hardware-encrypted credential vault.

No analytics, advertising trackers or remote executable code are included. Temporary provider-frame rules apply only to prepared YouTube tabs, YouTube-initiated provider subframes, and the selected provider. They are cleaned up when sessions/tabs are reset or access is removed.

## Controls and deletion

Privacy, support, extension disable controls, and email management remain reachable before signup. Remove email asks the collector to delete this browser's private GitHub signup, then clears local email/access, personal API configuration/keys, and session caches. If deletion cannot be confirmed, the receipt is kept so you can retry. Remove pending signup handles interrupted submissions. No user can retrieve other signup records through the public collector.

Removing an email does not sign you out of ChatGPT or Gemini or delete provider-held conversations. Uninstalling clears local extension storage, including the deletion receipt, but cannot notify the collector; use Remove email before uninstalling to request early deletion. Otherwise the one-year retention applies. Each browser may create a separate signup record for the same unverified address; removal affects that browser's record.

For support, [open an issue](https://github.com/wasely/chrome-extentions/issues) without posting your email, API keys or private content. See [security reporting](SECURITY.md) for sensitive reports.

Service policies: [GitHub](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement), [Cloudflare](https://www.cloudflare.com/privacypolicy/), [OpenAI](https://openai.com/policies/privacy-policy/), [Google](https://policies.google.com/privacy). A custom API provider has its own policy.
