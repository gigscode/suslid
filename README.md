# PitchPilot

PitchPilot is a focused prospect-research workspace for independent branding, design, web, and creative marketing agencies. It helps you review one publicly accessible website page, save evidence-backed observations, prepare editable outreach drafts, and track follow-ups. It does not send messages or promise sales outcomes.

## Current workflow

- Supabase signup, login, session refresh, and protected `/app` workspace using the existing App Router setup.
- First-run agency profile and onboarding.
- Create, search, edit, change status, and delete prospects.
- Server-side, limited inspection of one public HTML page with DNS/IP checks and redirect revalidation.
- Structured Gemini findings with evidence checked against the inspected page, plus editable email and DM drafts.
- Save drafts and follow-up activity against the current user's prospect.
- Row-level security and composite ownership constraints for user-owned prospect data.

## Local setup

1. Use Node.js 24 or later and pnpm 12.14.0 (the versions pinned in `package.json`).
2. Copy `.env.example` to `.env.local`.
3. Configure a **new PitchPilot Supabase project**, never the Remosus production project:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. For website analysis, set the server-only `GEMINI_API_KEY`. Optionally set `GEMINI_MODEL`; the default is `gemini-2.5-flash`.
5. Install dependencies with `pnpm install`.
6. Apply `supabase/migrations/20261021000000_pitchpilot_workflow.sql` to the new project using its Supabase SQL editor. This migration is self-contained for the PitchPilot workflow. Do not apply it to the Remosus database.
7. Start the app with `pnpm dev` and open `/`.

The repository contains older Remosus migrations. To avoid creating unused career-document storage and applying legacy schema on a fresh PitchPilot project, apply the standalone PitchPilot migration above instead of blindly applying the entire historical migration directory. If adopting the Supabase CLI migration history, review and separate the old migration history first.

## GitHub and Vercel deployment

1. Review the files you plan to publish. `.env.local`, other `.env.*` files, build output, and local assistant context files are ignored. Keep `.env.example` as the safe environment-variable template.
2. Push the project to a GitHub repository. The GitHub Actions workflow runs type checking, tests, and a production build on pushes and pull requests without requiring service credentials.
3. In Vercel, import the GitHub repository. Use the repository root as the project root, select Node.js 24 in Project Settings, and let Vercel detect Next.js and pnpm from `pnpm-lock.yaml`. The normal build command is `pnpm build`; no custom output directory or `vercel.json` is needed.
4. In Vercel Project Settings, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for each environment. Add `GEMINI_API_KEY` to enable website analysis. `GEMINI_MODEL` is optional and defaults to `gemini-2.5-flash`.
5. Use a separate test Supabase project for Vercel Preview deployments. Use the dedicated PitchPilot project for Production, never the Remosus production database. Do not add a Supabase service-role key.
6. In Supabase Authentication URL Configuration, set the Site URL to the production origin. Allow the local URL and the exact Vercel Preview/Production origins that need auth callbacks. Signup and password-reset links return through `/auth/callback`.
7. After deploying, test signup/confirmation, login, onboarding, prospect persistence, and analysis. Analysis needs `GEMINI_API_KEY`; database-backed features need the Supabase URL, publishable key, and PitchPilot migration.

Preview deployments can run the app without Gemini configured, but analysis will return a configuration error until `GEMINI_API_KEY` is set. Use test data and a test Supabase project for previews.

If Supabase environment variables are missing, the public landing and login pages still render. Sign-in and the authenticated workspace require `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Environment variables

| Variable | Required for | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase auth and database | Public URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase browser/server user-scoped client | Publishable key |
| `GEMINI_API_KEY` | Website analysis and draft generation | Server only |
| `GEMINI_MODEL` | Optional Gemini model selection | Server only |

Never put a service-role key or Gemini key in a `NEXT_PUBLIC_` variable. No payment credentials are used by this workflow.

## Commands and tests

- `pnpm dev` — development server.
- `pnpm typecheck` — strict TypeScript check.
- `pnpm test` — local URL safety, redirect-policy, prospect-input, and structured-findings tests.
- `pnpm build` — production build; build no longer ignores TypeScript errors.
- `pnpm start` — serve a production build.

RLS isolation test: create two disposable users in the **PitchPilot test project** and run:

```sh
psql "$PITCHPILOT_DATABASE_URL" \
  -v user_a_id=USER_A_UUID \
  -v user_b_id=USER_B_UUID \
  -f supabase/tests/pitchpilot_rls.sql
```

The script runs in a transaction and rolls back its fixtures. It verifies profile, prospect, analysis, draft, and activity isolation, including cross-user read/update attempts and attempts to attach analyses, drafts, or activities to another user's prospect.

## Security notes and limitations

- Website fetching accepts only HTTP(S) on standard ports, rejects URL credentials and non-public IP ranges, resolves all DNS answers, pins the actual connection to a checked address, rechecks each redirect, and caps redirects, request duration, response bytes, and extracted page text. It fetches one page and does not execute JavaScript.
- This implementation narrows SSRF exposure, but production deployment should still use outbound network egress restrictions where available. Do not treat it as a complete website crawl or audit.
- Gemini receives only bounded page text plus the user's agency/prospect context. Page contents are treated as untrusted data; generated structure is validated and every evidence quote must appear in the fetched page.
- Database changes are user-scoped and RLS-protected. The browser uses only the publishable key.
- The initial MVP has no analysis quota, server-side rate limiter, payment flow, bulk sending, crawler, or team access. Configure infrastructure-level request limits before exposing expensive analysis to a large audience.
- Multi-step analysis persistence is not a single database transaction. If Gemini succeeds but a later database write fails, the API returns an explicit partial-save error; retry after checking the prospect's saved records.
- Automated URL and schema tests run locally. The RLS SQL test requires a configured disposable Supabase database and two test users.

## Manual configuration and release checks

- [ ] Connect a separate PitchPilot Supabase project and apply the PitchPilot migration.
- [ ] Confirm the migration's RLS policies and grants in that project's SQL editor.
- [ ] Run the two-user RLS SQL test on a disposable test project.
- [ ] Add Supabase URL and publishable key to local/deployment environment settings.
- [ ] Add `GEMINI_API_KEY` to server environment settings for analysis.
- [ ] Test signup, email confirmation, login, logout, onboarding, and data isolation.
- [ ] Test a few legitimate public sites, blocked pages, and unsafe/private addresses.
- [ ] Review mobile layout, agency onboarding, draft persistence, and follow-up dates.
- [ ] Set deployment egress controls and operational rate limits before public launch.

## Framework

This project currently uses Next.js 16.4.2 App Router. There is no published Next.js 22 release; dependencies were not indiscriminately upgraded across unrelated major versions.
