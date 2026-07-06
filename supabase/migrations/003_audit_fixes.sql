-- supabase/migrations/003_audit_fixes.sql
--
-- Security lockdown + schema for reconnect detection, activity feed,
-- per-label descriptions and archive-on-label.
-- Idempotent: safe to run against the current live database.

-- ============================================================
-- 1. gmail_tokens: browser code must NEVER be able to read tokens.
--    Drops the live SELECT policy and the overly-broad FOR ALL policy
--    from 002_fix_rls.sql. Edge functions use the service role, which
--    bypasses RLS entirely, so no service-role policy is needed.
-- ============================================================
DROP POLICY IF EXISTS "Users select their own tokens" ON public.gmail_tokens;
DROP POLICY IF EXISTS "Users manage their own tokens" ON public.gmail_tokens;
DROP POLICY IF EXISTS "Service role tokens" ON public.gmail_tokens;
DROP POLICY IF EXISTS "Users can insert own tokens" ON public.gmail_tokens;
DROP POLICY IF EXISTS "Users can update own tokens" ON public.gmail_tokens;

CREATE POLICY "Users can insert own tokens" ON public.gmail_tokens
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON public.gmail_tokens
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Intentionally NO SELECT or DELETE policies for authenticated users.

ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. profiles: track Gmail connection health so a revoked token
--    surfaces as a reconnect banner instead of failing silently.
-- ============================================================
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS gmail_status TEXT NOT NULL DEFAULT 'connected';

-- ============================================================
-- 3. selected_labels: per-label AI description + archive-on-label
-- ============================================================
ALTER TABLE public.selected_labels
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS archive_on_label BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- 4. processed_emails: store metadata for the activity feed and
--    let users read their own rows (writes remain service-role only).
--    gmail_label_id stays NULL for analyzed-but-unmatched mail, which
--    is now also recorded (fixes infinite Gemini re-processing).
-- ============================================================
ALTER TABLE public.processed_emails
    ADD COLUMN IF NOT EXISTS subject TEXT,
    ADD COLUMN IF NOT EXISTS sender TEXT,
    ADD COLUMN IF NOT EXISTS gmail_label_name TEXT;

DROP POLICY IF EXISTS "Users read own processed emails" ON public.processed_emails;
CREATE POLICY "Users read own processed emails" ON public.processed_emails
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);
