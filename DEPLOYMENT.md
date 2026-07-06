# Deploying the audit fixes

The code on this branch fixes all Critical/High findings from the 2026-07-03 audit and adds
three features (per-label descriptions, activity feed, archive-on-label). Some steps can only
be done from the Supabase dashboard / CLI — do them **in this order**:

## 1. Rotate the exposed service-role key (do this first)

The old service-role key was embedded in plaintext in the pg_cron job and must be treated as
compromised.

- Supabase Dashboard → Project Settings → API → rotate the service-role key / JWT secret.
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

Then make it available to the edge function:

```bash
supabase secrets set CRON_SECRET=<value>
```

Then store the **same value** in Vault: Dashboard → Settings → Vault → new secret named `cron_secret`.

## 3. Apply the database migration

Run `supabase/migrations/003_audit_fixes.sql` (SQL editor or `supabase db push`). It:

- removes the SELECT/FOR ALL policies on `gmail_tokens` (browser can no longer read refresh tokens)
- adds `profiles.gmail_status` (reconnect detection)
- adds `selected_labels.description` and `selected_labels.archive_on_label`
- adds `processed_emails.subject`, `.sender`, `.gmail_label_name` + a user SELECT policy (activity feed)

## 4. Deploy the edge functions

```bash
supabase functions deploy fetch-labels
supabase functions deploy process-emails --no-verify-jwt   # auth is the x-cron-secret header
```

`--no-verify-jwt` matters: the function no longer accepts platform JWTs (the public anon key
could invoke it before); it now requires the `x-cron-secret` header instead.

## 5. Replace the cron job

Run `supabase/cron_setup.sql` in the SQL editor. It unschedules the old job (which carried the
service-role key in its headers) and schedules a new one that reads the secret from Vault.

## 6. Deploy the frontend

Merge this branch and let Vercel deploy. No new environment variables are needed.

## 7. Verify

- Cron: `select * from cron.job;` shows the new job; function logs show runs every 5 min.
- Direct invocation without the header is rejected:
  `curl -i https://<ref>.supabase.co/functions/v1/process-emails` → 401.
- Browser console on the dashboard: `await supabase.from('gmail_tokens').select('*')` returns no rows.
- Send yourself a test email → within 5 min it's labelled and appears in the dashboard activity feed.
- Add a description to a label and check the Gemini prompt respects it (function logs).
