-- supabase/migrations/005_selected_labels_unique.sql
--
-- Guarantee one row per (user, label). The 001 migration declared this
-- UNIQUE constraint but the live table may predate it; rapid double-clicks
-- in the label selector could otherwise create duplicate selections.

-- Remove any existing duplicates first (keep the oldest row per pair)
DELETE FROM public.selected_labels a
USING public.selected_labels b
WHERE a.user_id = b.user_id
  AND a.gmail_label_id = b.gmail_label_id
  AND a.created_at > b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS selected_labels_user_label_unique
    ON public.selected_labels (user_id, gmail_label_id);
