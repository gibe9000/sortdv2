-- supabase/migrations/002_fix_rls.sql

-- Drop the restrictive service-role only policy
DROP POLICY IF EXISTS "Service role tokens" ON public.gmail_tokens;

-- Allow users to insert/update/delete/select their OWN tokens
CREATE POLICY "Users manage their own tokens" ON public.gmail_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;
