-- supabase/cron_setup.sql
--
-- Replaces the old cron job that embedded the service-role key in plaintext.
-- Run this ONCE in the Supabase SQL editor, AFTER:
--   1. Rotating the service-role key (it was exposed - treat the old one as compromised)
--   2. Generating a random CRON_SECRET (see DEPLOYMENT.md for commands)
--   3. Setting it on the function:  supabase secrets set CRON_SECRET=<value>
--   4. Storing the SAME value in Vault (Dashboard -> Settings -> Vault, name: cron_secret)
--   5. Redeploying:  supabase functions deploy process-emails --no-verify-jwt

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Remove the old job that carried the service-role key in its headers
select cron.unschedule('invoke-process-emails');

select cron.schedule(
    'invoke-process-emails',
    '*/5 * * * *',
    $$
    select net.http_post(
        url := 'https://jhtcmyugbeslicfbzozr.supabase.co/functions/v1/process-emails',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
        )
    )
    $$
);
