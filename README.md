# outpulse studio

Your practice. Your clients. Your time. A workspace for independent professionals: website, enquiries, booking, clients, files, client portal, invoices.

This repo is **Stage 1 of 8**: accounts, mobile OTP, practice creation, 5-step setup, and the signed-in shell. Everything else is built in the next stages.
Full requirements: see the final report (v1.1).

## What is in Stage 1

| Area | Where |
|---|---|
| Database schema, row level security, `create_workspace()` | `supabase/migrations/0001_init.sql` |
| Database tests (39 checks) | `supabase/tests/`, run `npm run test:db` |
| Validation, slugs, OTP, plan limits | `lib/` (pure code), tests in `tests/logic.test.ts` |
| Sign up, log in, OTP, forgot and reset password | `app/(auth)/`, `app/actions/auth.ts` |
| 5-step setup and welcome | `app/(onboarding)/`, `app/actions/onboarding.ts` |
| Signed-in shell (glass pills, circle rail, gradient) and dashboard | `components/Shell.tsx`, `app/(app)/` |

## Honest status

| Part | Status |
|---|---|
| Database rules (tenant isolation, plan and slug protection, OTP privacy) | **Tested** on a real local Postgres 16. 39 checks pass |
| Validation, slug, OTP and plan logic | **Tested**, 11 tests pass |
| Next.js pages and server actions | **Written but never run.** Packages could not be installed in the build environment. Syntax and import paths were checked. Expect small errors on first `npm install && npm run build` |
| SMS sending (StartMessaging) | **Guess.** `lib/sms.ts` uses a generic request. Check StartMessaging's docs for the real URL and body |
| Cloudflare deployment | **Not set up yet** |

## Set up (one time)

1. **Supabase** (create a project in the Mumbai region)
   - SQL editor: paste and run `supabase/migrations/0001_init.sql`.
   - Authentication, Sign In / Providers, Email: **turn off** "Confirm email". Mobile OTP verifies new accounts instead.
   - Authentication, URL configuration: set the Site URL and add `https://YOUR-SITE/auth/callback` as a redirect URL.
   - Project settings, API: copy the project URL, anon key and service role key.
2. **Environment**: copy `.env.example` to `.env.local` and fill the values. Never commit real keys. The service role key and `OTP_PEPPER` stay on the server only.
3. **Run**: `npm install`, `npm run dev`. In development with no SMS key, the OTP code is printed in the terminal.
4. **Make yourself a platform admin** (for the Lab later): in the SQL editor, `insert into platform_admins (user_id) values ('YOUR-USER-ID');`

## Rules that must not be broken

- Every table that belongs to a practice must have row level security on and use `is_member()` or `is_owner()`.
- Users never write `plan`, `slug`, `mobile_verified_at`, memberships or OTP rows directly. Those go through functions or the service role.
- Add a database test for every new table before using it.

## Tests

```
npm run test:logic   # needs only Node 22
npm run test:db      # needs Postgres 14+ binaries; starts a throwaway database
```

## Next stages

2 Website and domains. 3 Enquiries, booking, Google Calendar. 4 Clients, files, messages. 5 Invoices and payments. 6 Client portal and notifications. 7 Marketing site, legal, help. 8 Admin console, monitoring, security checklist.
