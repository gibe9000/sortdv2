-- supabase/migrations/001_schema.sql

-- User profiles
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    sorting_enabled BOOLEAN DEFAULT FALSE,
    emails_processed INT DEFAULT 0,
    last_processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gmail tokens
CREATE TABLE public.gmail_tokens (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

-- Selected labels (which Gmail labels user wants to use for sorting)
CREATE TABLE public.selected_labels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    gmail_label_id TEXT NOT NULL,
    gmail_label_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, gmail_label_id)
);

-- Processed emails (deduplication)
CREATE TABLE public.processed_emails (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    gmail_message_id TEXT NOT NULL,
    label_id TEXT,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, gmail_message_id)
);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.selected_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own profile" ON public.profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users own selected_labels" ON public.selected_labels
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role tokens" ON public.gmail_tokens
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role processed" ON public.processed_emails
    FOR ALL USING (auth.role() = 'service_role');

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
