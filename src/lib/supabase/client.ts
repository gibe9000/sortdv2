import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
        // Return a minimal no-op client for local dev when env vars are missing
        const noop = async (..._args: any[]) => {
            throw new Error('Supabase env vars are not configured for local development')
        }
        return {
            auth: {
                signInWithOAuth: noop,
                getSession: async () => ({ data: { session: null }, error: null }),
                getUser: async () => ({ data: { user: null }, error: null }),
                signOut: async () => ({ error: null })
            },
            from: () => ({
                delete: () => ({ eq: () => ({}) }),
                insert: async () => ({ data: null, error: new Error('Supabase not configured') }),
                select: async () => ({ data: null, error: new Error('Supabase not configured') })
            }),
            functions: {
                invoke: async () => ({ data: null, error: new Error('Supabase not configured') })
            }
        } as any
    }

    return createBrowserClient(url, key)
}
