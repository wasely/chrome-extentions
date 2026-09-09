# Watch Better Privacy Policy

Updated September 9, 2026. This policy describes the public release candidate in this repository.

## Email access

We ask you to enter an email address once to unlock extension features on this browser. No verification code or password is required. The email stays in local Chrome extension storage restricted to trusted extension contexts. It is not sent to the publisher, YouTube, or an email service, and is not synced or used for marketing. Entering an email does not create a server account or verify ownership of the address.

Access is remembered until you remove the email, clear extension storage, or uninstall. Local access checks work offline; YouTube and AI features still require their normal connections. The email is not included in AI prompts.

## Video information and AI

On enabled YouTube pages after email entry, Watch Better reads video identifiers, titles, URLs and available captions to provide transcripts, search, navigation and Smart Skip. Captions may be prefetched for the currently watched video. Quick Learn requests another video's captions after its button is pressed. We do not collect general browsing history, download videos, upload thumbnails to AI, or read the clipboard. Copying selected captions writes to the clipboard only when requested.

Opening embedded Ask or Quick Learn shares bounded transcript context with the selected signed-in ChatGPT or Gemini service. Follow-up questions are sent when you submit them. Providers receive normal browser/network/session information and apply their own account, retention and usage policies. Watch Better does not read or store provider cookies, passwords or web-session tokens. Embedded sessions may remain loaded while you switch extension tabs.

Personal API fallback is optional. After an explicit endpoint permission grant, requested prompts, bounded captions and recent conversation context are sent directly from the extension background to that endpoint. The key authenticates those requests. Custom endpoint operators receive the key and supplied content; select only an endpoint you trust. API usage charges and provider retention rules may apply. Watch Better has no AI proxy collecting these requests.

Smart Skip is experimental and off by default. Local analysis stays on the device. Starting deep scan explicitly sends caption chunks to the selected AI connection. API scans do not automatically retry failed paid requests.

## Device storage

Settings persist locally. Transcript caching is memory-only by default; the optional browser-session cache clears on browser exit or extension reload. Smart Skip maps use session storage. API conversation text remains in the open card's memory; external providers may retain their copies. API keys use trusted session storage by default and are forgotten when Chrome closes or the extension reloads. Remember stores the key locally on this device, never in sync storage. Disconnect removes it and requests removal of the optional endpoint permission. Local storage is not a hardware-encrypted credential vault.

No analytics, advertising trackers or remote executable code are included. Temporary provider-frame rules apply only to prepared YouTube tabs, YouTube-initiated provider subframes, and the selected provider. They are cleaned up when sessions/tabs are reset or access is removed.

## Controls and deletion

Privacy, support, extension disable controls, and email management remain reachable without full feature access. Remove email in the popup or settings clears this browser's saved email, personal API configuration/keys and session caches, and locks extension features until an email is entered again. It does not sign you out of ChatGPT or Gemini or delete provider-held conversations. Uninstalling clears extension storage. Watch Better has no server account to delete. Provider data remains governed by the provider's retention and deletion controls.

For support, [open an issue](https://github.com/wasely/chrome-extentions/issues) without posting your email, API keys or private content. See [security reporting](SECURITY.md) for sensitive reports.

Service policies: [OpenAI](https://openai.com/policies/privacy-policy/), [Google](https://policies.google.com/privacy). A custom API provider has its own policy.
