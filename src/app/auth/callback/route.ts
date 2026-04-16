import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
            console.error('[Auth Callback] Exchange error:', error.message)
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
        }

        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.provider_token && session?.user) {
            const user = session.user
            console.log('[Auth Callback] Saving tokens for user:', user.id)
            console.log('[Auth Callback] provider_token:', !!session.provider_token)
            console.log('[Auth Callback] provider_refresh_token:', !!session.provider_refresh_token)

            const expiresAt = new Date()
            expiresAt.setSeconds(expiresAt.getSeconds() + (session.expires_in || 3600))

            // ========== FIX: Conditional upsert logic ==========
            if (session.provider_refresh_token) {
                // We received a new refresh token - save everything
                console.log('[Auth Callback] New refresh token received, doing full upsert')
                
                const { error: upsertError } = await supabase
                    .from('gmail_tokens')
                    .upsert({
                        user_id: user.id,
                        access_token: session.provider_token,
                        refresh_token: session.provider_refresh_token,
                        expires_at: expiresAt.toISOString()
                    }, { onConflict: 'user_id' })

                if (upsertError) {
                    console.error('[Auth Callback] Token upsert failed:', upsertError)
                } else {
                    console.log('[Auth Callback] Full tokens saved successfully')
                }
            } else {
                // No refresh token - only update access_token and expires_at
                // This PRESERVES the existing refresh_token in the database
                console.log('[Auth Callback] No refresh token received, updating access_token only')
                
                const { error: updateError } = await supabase
                    .from('gmail_tokens')
                    .update({
                        access_token: session.provider_token,
                        expires_at: expiresAt.toISOString()
                    })
                    .eq('user_id', user.id)

                if (updateError) {
                    console.error('[Auth Callback] Token update failed:', updateError)
                    // Edge case: user doesn't exist in gmail_tokens yet but no refresh token
                    // This shouldn't happen normally, but log it
                    console.error('[Auth Callback] This may mean the user has no existing tokens and Google did not provide a refresh token. User needs to re-consent.')
                } else {
                    console.log('[Auth Callback] Access token updated, refresh token preserved')
                }
            }
            // ========== END FIX ==========
            
        } else {
            console.warn('[Auth Callback] No provider_token found in session')
        }

        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'
        if (isLocalEnv) {
            return NextResponse.redirect(`${origin}${next}`)
        } else if (forwardedHost) {
            return NextResponse.redirect(`https://${forwardedHost}${next}`)
        } else {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
