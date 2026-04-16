'use client'

import { createClient } from '@/lib/supabase/client'

export function LoginButton() {
    const hasSupabase = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const handleLogin = async () => {
    if (!hasSupabase) return
    
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: 'https://sortdv2.vercel.app/auth/callback',  // <-- Hardcoded
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
            scopes: 'https://www.googleapis.com/auth/gmail.labels https://www.googleapis.com/auth/gmail.modify email profile openid'
        },
    })
}

    return (
        <button
            onClick={handleLogin}
            disabled={!hasSupabase}
            title={!hasSupabase ? 'Configure Supabase env vars to enable Google login (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)' : undefined}
            className={`group relative px-8 py-4 font-mono font-bold tracking-wider uppercase transition-all duration-300 ${
                hasSupabase
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
        >
            <div className="absolute inset-0 bg-white/20 translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
            {hasSupabase ? 'Connect Gmail' : 'Login disabled (env not set)'}
        </button>
    )
}
