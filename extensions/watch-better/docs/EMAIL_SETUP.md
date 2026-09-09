# Email service setup

Deployment is pending account access. Source code alone does not enable public email delivery.

1. Create a **Free** Supabase project named Watch Better. Keep database passwords and service-role keys outside this repository and the extension.
2. In Resend's Free account, add `auth.syncmedia.shop`. Add exactly the DKIM, SPF/MX and any verification DNS values Resend generates to the domain's DNS. Do not replace the root domain's records. Verify the subdomain.
3. Create a Resend sending-only key scoped to this domain. In Supabase Auth's custom SMTP settings use `smtp.resend.com`, port `465`, username `resend`, and that key as the password. Sender: `Watch Better <login@auth.syncmedia.shop>`.
4. Enable email signup and confirmation. Set OTP length 6, expiry 600 seconds, minimum resend interval 60 seconds. Use `supabase/templates/code.html` for both confirmation and magic-link templates. Remove passwords and social providers from the public UI.
5. Apply conservative Auth rate limits; keep within the free email quota. Never enable paid overages. The extension reports throttling and does not retry sends automatically. At larger public volume, free email limits may prevent more sign-ins that day.
6. Deploy `supabase/functions/delete-account` with `verify_jwt = false` as declared in config. The function performs its own online JWT verification and only deletes the verified caller. Server-only Supabase environment credentials stay on Supabase.
7. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in local `.env` or the build environment. These two values are public. Never add the SMTP or service-role key. Build with `npm run build`; check the manifest contains the exact project host.
8. Test a real new email: send, delivered six-digit code, wrong/expired code, successful verification, restart, resend throttle, offline grace, logout, login, then account deletion. Check that deletion actually removes the user in Supabase.

Supabase's default SMTP is unsuitable for public signup. Custom SMTP and verified DNS are release requirements. No DNS records or live account settings have been applied by the repository.

References: [Supabase email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless), [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Resend SMTP](https://resend.com/docs/send-with-smtp).
