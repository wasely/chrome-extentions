# Email entry: no service setup

The owner replaced verified email login with local email entry on September 9, 2026.
Enter a validly formatted email in the extension and select Continue for full access.
The address stays in trusted local Chrome extension storage; it is not verified,
synced, sent to the publisher, or used for marketing. This is onboarding, not proof
of identity or a server account. Remove email clears local access and disconnects
personal APIs. Uninstalling also removes extension storage.

No Supabase, Resend, SMTP, DNS, domain, environment values, or always-on computer
are required. The unused backend source and build configuration were removed.
Existing candidate authentication credentials are discarded locally; no public
email backend was deployed. Remaining browser/store checks are recorded in
[RELEASE_STATUS.md](RELEASE_STATUS.md).
