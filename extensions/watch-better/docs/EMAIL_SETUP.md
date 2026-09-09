# Private email collection

The owner approved collection in the private `wasely/watch-better-emails` repository on September 9, 2026. Addresses appear in its **Issues** section, labeled **email-signup**. They are not stored in the public extension source or in Git commits.

Users enter an email, explicitly agree to collection, and select Continue. The Cloudflare Worker saves the signup before access unlocks. No verification email, custom domain, DNS change, subscription, or always-on PC is required. No marketing consent is assumed.

## Current setup

- Private repository created and Issues label configured. Actions disabled for the data repo.
- Collector deployed at `https://watch-better-emails.kaiguy432.workers.dev`.
- The live collector currently reports `configured: false`; the restricted GitHub key is still required.
- Backend source is maintained separately in `C:/code/watch-better-emails` and its private repository.
- `.env.example` contains only the public `VITE_EMAIL_COLLECTOR_URL`. Copy it to `.env.local` for builds.

## Activation

Sign into GitHub and create a fine-grained token restricted to **watch-better-emails** with Issues read/write and Metadata read. Save it directly as the Cloudflare Worker secret **GITHUB_TOKEN**. Never use a general repository token in the extension. Verify issue deletion permission as part of the smoke test. No token value belongs in source, screenshots, reports, or chat.

Use the collector's README for deployment. After the restricted key is installed, test live signup, retry deduplication, browser restart, removal, and a failed-delete retry. Delete synthetic test data. Only then mark `emailCollection` and `emailDeletion` evidence true.

Records are unverified and automatically scheduled for deletion after one year. Remove email requests earlier deletion using a device receipt. Uninstalling loses that receipt; it does not notify the collector. Private GitHub and Cloudflare platform retention policies still apply.
