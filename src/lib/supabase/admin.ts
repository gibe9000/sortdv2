import { createClient } from '@supabase/supabase-js'

// Server-only client with the service-role key. Bypasses RLS.
// SUPABASE_SERVICE_ROLE_KEY must be set in Vercel (no NEXT_PUBLIC_ prefix -
// it must never reach the browser). Only use this in route handlers /
// server components, never in client components.
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_URL) is not configured')
    }

    return createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    })
}
