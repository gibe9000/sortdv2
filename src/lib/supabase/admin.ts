import { createClient } from '@supabase/supabase-js'

// Server-only client that bypasses RLS. Set ONE of these in Vercel
// (no NEXT_PUBLIC_ prefix - it must never reach the browser):
//   SUPABASE_SECRET_KEY       - new-style secret API key (sb_secret_..., preferred)
//   SUPABASE_SERVICE_ROLE_KEY - legacy JWT service_role key
// Only use this in route handlers / server components, never in client components.
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
        throw new Error('SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_URL) is not configured')
    }

    return createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    })
}
