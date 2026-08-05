# Dynamic Voucher System — Setup Guide

A secure, dynamic voucher system with an authenticated **admin portal** (`/admin`) and a
**recipient experience** that shows vouchers in real time via Supabase Realtime.

## 1. Apply the database migration

Run the new migration against your Supabase project (Supabase Studio → SQL Editor, or the
Supabase CLI):

```bash
supabase db push
# or paste supabase/migrations/20260806000000_voucher_system.sql into the SQL Editor and Run.
```

This creates `profiles`, `vouchers`, `voucher_activity`, RLS policies, the `claim_voucher`
(atomic) / `is_admin` / `mark_expired_vouchers` / `promote_admin` / `update_my_display_name`
RPCs, the `vouchers` storage bucket, signup triggers, and registers the tables for Realtime.

## 2. Create the two Supabase Auth accounts (one-time, in Supabase Studio → Authentication → Users)

- **Admin (the boyfriend/owner):** create a user with the owner's email and a strong password.
- **Recipient (Angel):** create a user with `angelicogn@gmail.com` (or whatever email is in
  `site_settings.allowed_email`) and a password. Tell Angel her password.

A trigger automatically creates a `profiles` row for each new user.

## 3. Designate the admin (one-time, in Supabase Studio → SQL Editor)

```sql
select public.promote_admin('your-admin-email@example.com');
```

This stores the admin email in `site_settings.admin_email` and promotes any existing profile
with that email to `role = 'admin'`. If the admin user signs up *after* this, the
`set_admin_role_on_signup` trigger auto-promotes them on signup. (Optional: also set
`VITE_ADMIN_EMAIL` in `.env` to pre-fill the admin login form — this is a UI hint only.)

## 4. Configure redirect URLs (Supabase Studio → Authentication → URL Configuration)

Add your production URLs so Supabase Auth redirects work in production:

- Site URL: `https://your-domain`
- Redirect URLs: `https://your-domain`, `https://your-domain/admin/login`

## 5. Environment variables (Vercel Project Settings → Environment Variables)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL` (optional, UI hint only)
- `VITE_ALLOWED_EMAIL` (optional, overrides `site_settings.allowed_email`)

**Never** add the Supabase service-role key to the frontend. All privileged operations go
through RLS policies and `SECURITY DEFINER` RPCs that verify `is_admin()` server-side.

## 6. Run

```bash
pnpm install
pnpm dev      # http://localhost:5173
```

- Admin portal: `http://localhost:5173/admin` → redirects to `/admin/login`.
- Recipient site: `http://localhost:5173/` → unlock with Angel's email + password, then tap
  **My Vouchers** in the top bar.

## How it works

- **Creating/sending** a voucher (admin) writes a `vouchers` row. The recipient sees it
  instantly via Supabase Realtime while online, and on load/refresh via a normal query.
- **Claiming** calls the atomic `claim_voucher` RPC. The single guarded `UPDATE` is the
  atomicity boundary — concurrent claims can't both succeed; expired/cancelled/already-claimed
  or not-yours claims all fail with `claim_failed`. A `voucher_activity` row is recorded.
- **Admin sees claims in real time** — the dashboard subscribes to `vouchers` +
  `voucher_activity` and refreshes react-query caches when they change.
- **Refresh-safe routes** — `vercel.json` rewrites all routes to `/index.html`, so refreshing
  `/admin/dashboard` never 404s.

## Tests

```bash
pnpm test            # vitest (frontend unit/component tests)
```

SQL assertions for the claim RPC (atomicity + rejection of expired/cancelled/not-owned) live in
`supabase/tests/claim_voucher_test.sql` — run them against your project via the SQL Editor.