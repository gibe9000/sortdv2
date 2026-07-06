-- supabase/migrations/004_tokens_service_role_only.sql
--
-- gmail_tokens is now written exclusively server-side (auth callback uses the
-- service-role key, which bypasses RLS). Browser sessions get zero access:
-- the 003 INSERT/UPDATE policies are no longer needed, and the upsert that
-- relied on them failed anyway (ON CONFLICT DO UPDATE needs to read the
-- existing row, which requires SELECT - exactly what we refuse to grant).
--
-- Requires: SUPABASE_SERVICE_ROLE_KEY set as a server-side env var in Vercel.

DROP POLICY IF EXISTS "Users can insert own tokens" ON public.gmail_tokens;
DROP POLICY IF EXISTS "Users can update own tokens" ON public.gmail_tokens;

-- RLS enabled + no policies = authenticated users cannot touch this table at all.
ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;
