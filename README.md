> [!NOTE]
> **This copy is archived. The maintained project lives at [blixvip/watch-better](https://github.com/blixvip/watch-better).**
> Issues, releases and pull requests all happen there. Contributors are welcome:
> see its [good first issues](https://github.com/blixvip/watch-better/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
> and the [Discord](https://discord.gg/grokbot).

# Chrome extensions

[Watch Better](extensions/watch-better) adds captions, transcript search, timestamp navigation, AI questions, Quick Learn, and experimental Smart Skip to desktop YouTube.

This is the separate public release source. **Chrome Web Store submission is blocked until public links and browser release checks pass.** There is no public store listing yet.

- English defaults. Smart Skip starts off and recommends staying off while in development.
- Enter an email and agree to private signup collection for access; no verification, password, or subscription.
- Embedded ChatGPT/Gemini, with optional personal Gemini or OpenAI-compatible API access.
- Cloudflare collects signups into a private GitHub repo. No email delivery, domain setup, or always-on PC required. Collector activation is pending.

See [setup](extensions/watch-better/README.md), [privacy](extensions/watch-better/PRIVACY.md), and [release status](extensions/watch-better/docs/RELEASE_STATUS.md). Target: desktop Chrome 133+; mobile Chrome cannot install this extension. Cross-OS live testing remains pending.

```powershell
cd extensions/watch-better
npm ci
npm run validate
```

[Report a bug](https://github.com/wasely/chrome-extentions/issues). Please remove account details, API keys, and private video information from reports.

## Contributors wanted

Small, scoped work is labelled and waiting: [good first issues](https://github.com/wasely/chrome-extentions/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) name the files to touch and what "done" looks like. Comment to claim one. Pull requests get reviewed within a couple of days, and every contributor is credited in the release notes.

<!-- discord-incentive:start -->
### 💬 Why join the Discord first

**[discord.gg/grokbot](https://discord.gg/grokbot)** is the one server for every blixvip repo, and it gets you more than a chat window:

- 🟢 **Claim an issue and it is yours.** Say which one in `#contributors` and it is assigned to you, so two people never build the same thing twice.
- 🏷️ **A contributor role** on the server the moment your first pull request is merged.
- 🗺️ **A say in what gets built.** The roadmap is argued out there before it turns into issues.
- 🙋 **A human to ask.** Stuck on setup, or unsure whether an idea is even wanted? Faster than waiting on an issue thread.
<!-- discord-incentive:end -->