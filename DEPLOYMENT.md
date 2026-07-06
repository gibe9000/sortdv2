# Update 2026-07-06b: feature batch (suggestions, batched AI, account controls)

Rollout for the second batch (AI label suggestions, batched Gemini calls,
no-consent returning logins, Disconnect/Delete account):

1. **SQL editor:** run `supabase/migrations/005_selected_labels_unique.sql`.
2. **Dashboard → Edge Functions:**
   - `process-emails`: paste the updated code (now batches all emails into one
     Gemini call) and Deploy. JWT verification stays **OFF**.
   - **Create a NEW function named `suggest-labels`**, paste
     `supabase/functions/suggest-labels/index.ts`, Deploy. JWT verification **ON**.
     It uses the same secrets as the others (no new secrets needed).
3. **Vercel:** merge/deploy the branch. No new env vars.
4. Verify: log in fresh (no Google consent screen for returning users), footer
   shows Sign out / Disconnect Gmail / Delete account, and with no labels the
   dashboard offers "✨ Suggest labels based on my recent email".

---

# Deploying the audit fixes

The code on this branch fixes all Critical/High findings from the 2026-07-03 audit and adds
three features (per-label descriptions, activity feed, archive-on-label).

**Important:** the files under `supabase/functions/` do NOT deploy automatically when you merge
this branch — they are the version-controlled source. The functions that actually run live in
Supabase and must be updated by hand (dashboard) or with the CLI. Everything below can be done
entirely from the Supabase dashboard; CLI commands are given as alternatives.

Do the steps **in this order**:

## 1. Rotate the exposed service-role key (do this first)

The old service-role key was embedded in plaintext in the pg_cron job and must be treated as
compromised.

- Dashboard → Project Settings → API → rotate the service-role key / JWT secret.
- Update the `SUPABASE_SERVICE_ROLE_KEY` secret anywhere it's used (edge functions pick it up
  automatically; check any other place you pasted it).

## 2. Create the cron secret

Generate a random secret with whichever tool you have:

```bash
# Node
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```powershell
# PowerShell
-join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
```

Put the value in **two places** (they must match):

- **Function secret:** Dashboard → Edge Functions → Secrets → add `CRON_SECRET`
  (CLI: `supabase secrets set CRON_SECRET=<value>`)
- **Vault:** Dashboard → Project Settings → Vault → new secret named `cron_secret`
  (the cron job reads it from here)

## 3. Apply the database migrations

Copy `supabase/migrations/003_audit_fixes.sql` into the SQL editor and run it. It:

- removes the SELECT/FOR ALL policies on `gmail_tokens` (browser can no longer read refresh tokens)
- adds `profiles.gmail_status` (reconnect detection)
- adds `selected_labels.description` and `selected_labels.archive_on_label`
- adds `processed_emails.subject`, `.sender`, `.gmail_label_name` + a user SELECT policy (activity feed)

Then run `supabase/migrations/004_tokens_service_role_only.sql`. It removes the remaining
user INSERT/UPDATE policies on `gmail_tokens` — token writes now happen server-side only
(see step 3b).

## 3b. Add a secret key to Vercel

The auth callback now saves Google tokens with a privileged key (server-side only,
never shipped to the browser). **Preferred: the new-style secret API key.**

1. Dashboard → Project Settings → API Keys → create/reveal a **secret key** (`sb_secret_...`).
2. Vercel → Project → Settings → Environment Variables → add
   `SUPABASE_SECRET_KEY` = that value. Do **not** prefix it with `NEXT_PUBLIC_`.
3. Redeploy the frontend afterwards (env changes need a redeploy).

(Legacy alternative: set `SUPABASE_SERVICE_ROLE_KEY` = the JWT service_role key.
The code accepts either; `SUPABASE_SECRET_KEY` wins if both are set.)

Without this, logins succeed but Gmail tokens are never saved and labels won't load.

## 3c. Optional but recommended: migrate fully to new API keys

New-style keys can be rotated/revoked individually without invalidating user sessions,
which the legacy JWT keys can't. Full migration:

1. Dashboard → Project Settings → API Keys → enable/create the new keys:
   **publishable** (`sb_publishable_...`) and **secret** (`sb_secret_...`).
2. Vercel: set `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the publishable key (it's a drop-in
   replacement), and `SUPABASE_SECRET_KEY` = the secret key.
3. Edge functions: add a secret named `SB_SECRET_KEY` = the secret key
   (Dashboard → Edge Functions → Secrets). The functions prefer it over the
   auto-injected legacy key. Custom secrets may not start with `SUPABASE_`,
   hence the different name.
4. Once everything runs on new keys, disable the legacy JWT-based keys on the
   API Keys page. From then on, JWT-secret rotation no longer breaks API access,
   and a leaked key can be revoked on its own.

## 4. Update the edge functions in Supabase

Via the dashboard:

1. Dashboard → Edge Functions → `process-emails` → open the code editor, replace the entire
   contents with `supabase/functions/process-emails/index.ts` from this branch, and deploy.
2. Same for `fetch-labels` with `supabase/functions/fetch-labels/index.ts`.
3. On `process-emails` → Details/Settings: turn **OFF "Enforce JWT verification"**.
   The function no longer accepts platform JWTs (the public anon key could invoke it before);
   it now authenticates the cron caller with the `x-cron-secret` header instead.
   Leave JWT verification **ON** for `fetch-labels`.

Via the CLI (equivalent):

```bash
supabase functions deploy fetch-labels
supabase functions deploy process-emails --no-verify-jwt
```

## 5. Replace the cron job

Copy `supabase/cron_setup.sql` into the SQL editor and run it. It unschedules the old job
(which carried the service-role key in its headers) and schedules a new one that reads the
secret from Vault.

## 6. Deploy the frontend

Merge this branch and let Vercel deploy. No new environment variables are needed.

## 7. Verify

- Cron: `select * from cron.job;` shows the new job; function logs show runs every 5 min.
- Direct invocation without the header is rejected:
  `curl -i https://<ref>.supabase.co/functions/v1/process-emails` → 401.
- Browser console on the dashboard: `await supabase.from('gmail_tokens').select('*')` returns no rows.
- Send yourself a test email → within 5 min it's labelled and appears in the dashboard activity feed.
- Add a description to a label and check the Gemini prompt respects it (function logs).

## Keeping repo and Supabase in sync from now on

The audit found the repo's function code had drifted from what was deployed. Whenever you edit
a function in the dashboard, paste the same code back into `supabase/functions/<name>/index.ts`
and commit — or better, make the repo the source of truth and deploy with
`supabase functions deploy` (GitHub Actions can do this automatically on push).
