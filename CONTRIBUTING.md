# Contributing

Watch Better source is in `extensions/watch-better`. Use Node 22.12+ and npm 10+.

```powershell
cd extensions/watch-better
npm ci
npm run dev:harness
npm run validate
```

Keep changes focused. Include meaningful tests for behavior changes and screenshots for UI changes. Test real YouTube navigation when changing its lifecycle. Clearly label fixture evidence and skipped live checks.

Never include `.env`, emails, account sessions, API keys, server secrets or private video content. Report sensitive issues through [private vulnerability reporting](https://github.com/wasely/chrome-extentions/security/advisories/new).

No paid infrastructure changes. Store packaging remains blocked until the release evidence matches the exact candidate version.
