'use client'

import { createClient } from '@/lib/supabase/client'

export function LoginButton() {
    const supabase = createClient()

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${location.origin}/auth/callback`,
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
            className="group relative px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold tracking-wider uppercase transition-all duration-300"
        >
            <div className="absolute inset-0 bg-white/20 translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
            Connect Gmail
        </button>
    )
}
