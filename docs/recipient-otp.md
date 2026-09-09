# Recipient email code sign-in

The login UI requests and verifies codes for `angelicogn@gmail.com` through the `recipient-otp` Edge Function. The recipient address is fixed server-side; no new accounts are created. Supabase Auth manages code generation, expiry, consumption and throttling. The existing lockout RPCs also check and record verification attempts. Admin password sign-in is unchanged.

## Live delivery prerequisite

On 2026-09-09 Supabase rejected updating the Magic Link email template because this project uses the free default email provider. Configure a custom SMTP provider in Authentication email settings, then set the Magic Link template to `supabase/templates/recipient-code.html` (including `{{ .Token }}`). Set an appropriate OTP expiry in Email provider settings. After verifying the template and SMTP settings, set the Edge Function secret `RECIPIENT_OTP_EMAIL_READY=true`.

Brevo SMTP and the numeric-code template were saved through the project dashboard, and `RECIPIENT_OTP_EMAIL_READY=true` was enabled. The first live send failed with SMTP `525 5.7.1 Unauthorized IP address`. Brevo subsequently showed `52.77.142.121` as authorized with SMTP IP blocking still enabled. The next live request to `recipient-otp` returned HTTP 200 with `success: true`. Inbox delivery and a real code verification remain unverified. Credentials are stored only in hosted SMTP settings, not in this repository.

Avoid a broad `supabase config push`: local defaults differ from hosted settings. Change only the email provider/template fields in the dashboard.

## Acceptance check

Brevo transactional logs confirmed **Delivered** to `angelicogn@gmail.com` at 23:23 on 2026-09-09, subject `Your personal page sign-in code`. Brevo rewrote the Gmail sender to its `brevosend.com` domain. Real code entry, session restoration and reuse rejection still require end-to-end verification.

Request one code from the UI, confirm inbox delivery, enter it and confirm a recipient session. Refresh to confirm session restoration, sign out, and confirm the consumed code cannot be reused. Check invalid/expired codes, the resend cooldown and mobile keyboard entry. Never store an OTP or tokens in test artifacts.
