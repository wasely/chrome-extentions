# Watch Better public candidate

Read AGENTS.md and docs/RELEASE_STATUS.md. This is the separate public release source in wasely/chrome-extentions; do not modify the original development checkout.

The approved scope includes local email entry without verification or a server, and optional personal Gemini/OpenAI-compatible API access. Embedded providers remain primary. English defaults; Smart Skip off by default and in development. Free infrastructure plans only.

No embedded server secrets, analytics, provider cookie access, remote executable code, video downloads, or silent paid API retries. Email and API keys stay in trusted extension storage; content scripts use typed messages. No email is sent to the publisher.

Run npm run validate. Inspect changed UI in the fixture harness. Record actual live results before enabling any release-evidence flag. Do not claim Chrome Web Store readiness while a gate remains incomplete.
