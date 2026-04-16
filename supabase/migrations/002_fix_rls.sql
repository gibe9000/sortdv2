-- supabase/migrations/002_fix_rls.sql

-- Drop the restrictive service-role only policy
DROP POLICY IF EXISTS "Service role tokens" ON public.gmail_tokens;

-- Allow users to insert/update/delete/select their OWN tokens
CREATE POLICY "Users manage their own tokens" ON public.gmail_tokens
    FOR ALL USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;

-- Recreate the profile trigger in case it was lost during auth user cleanup/testing.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
