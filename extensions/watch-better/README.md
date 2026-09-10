# Watch Better

YouTube captions, transcript search, timestamp navigation, Quick Learn, AI questions, and experimental Smart Skip in a desktop Chrome extension.

**1.0.3 release candidate; not submitted to the Chrome Web Store.** Collector activation, public links and live browser checks are still required. See [release status](docs/RELEASE_STATUS.md).

## Public experience

- Enter an email and agree to collection for full access; no verification code. Signup addresses are stored privately in GitHub through Cloudflare. No password, subscription, or marketing signup.
- English interface and preferred English captions; choose original or another available track at any time.
- Search, select, copy, and seek transcript rows. Separate floating cards retain their video context.
- Use signed-in ChatGPT or Gemini in Ask. Opening embedded Ask shares bounded caption context. Provider sign-in, availability, and usage limits still apply.
- Optional Advanced personal API fallback: Gemini or an OpenAI-compatible HTTPS endpoint. Keys stay in trusted extension storage, for the session unless Remember is selected. API providers may charge for requests.
- Smart Skip is off by default and explicitly marked in development. Keeping it off is recommended.

Target: Chrome 133+ on Windows, macOS, Linux and ChromeOS. Mobile Chrome is unsupported. Cross-platform CI checks source/build behavior; real browser checks remain separate.

## Develop and review

Requires Node 22.12+ and npm 10+.

```powershell
npm ci
npm run dev:harness
npm run validate
npm run build
```

Load `.output/chrome-mv3` through `chrome://extensions` → Developer mode → Load unpacked. Configure the public collector URL, open a YouTube video, enter an email over the blurred panel, and press Enter to agree to the visible collection disclosure. No domain or DNS setup is required. See [email entry](docs/EMAIL_SETUP.md). This signup does not verify identity. The collector needs a server-only GitHub key; never put that key into the extension. Never bundle or commit personal API keys.

```powershell
npm run zip           # local review candidate, not proof of release readiness
npm run package:store # validation plus mandatory live-evidence gates
```

## Verification and support

Tests cover transcript parsing/selection, Smart Skip safeguards, navigation and disposal, consented email collection/deletion, API parsing/cancellation and storage privileges. [Release status](docs/RELEASE_STATUS.md) lists the external checks still required. Harness screenshots are fixture previews, not evidence of live provider or installed-extension behavior.

[Privacy](PRIVACY.md) · [Store packet](docs/CHROME_WEB_STORE.md) · [Report a bug](https://github.com/wasely/chrome-extentions/issues)

MIT license; see [LICENSE](LICENSE).
