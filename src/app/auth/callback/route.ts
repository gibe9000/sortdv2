import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        
        // The session with provider_token is in the RETURN VALUE, not getSession()
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (error) {
            console.error('[Auth Callback] Exchange error:', error.message)
            return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
        }

        // USE data.session - this has the provider tokens!
        const session = data.session
        
        if (session?.user) {
            const user = session.user
            
            console.log('[Auth Callback] User:', user.id)
            console.log('[Auth Callback] provider_token:', session.provider_token ? 'YES' : 'NO')
            console.log('[Auth Callback] provider_refresh_token:', session.provider_refresh_token ? 'YES' : 'NO')

            // Only save if we have the provider token
            if (session.provider_token) {
                const expiresAt = new Date()
                expiresAt.setSeconds(expiresAt.getSeconds() + (session.expires_in || 3600))

                if (session.provider_refresh_token) {
                    // Full upsert with new refresh token
                    const { error: upsertError } = await supabase
                        .from('gmail_tokens')
                        .upsert({
                            user_id: user.id,
                            access_token: session.provider_token,
                            refresh_token: session.provider_refresh_token,
                            expires_at: expiresAt.toISOString()
                        }, { onConflict: 'user_id' })

                    if (upsertError) {
                        console.error('[Auth Callback] Upsert failed:', upsertError)
                    } else {
                        console.log('[Auth Callback] Tokens saved with refresh token')
                    }
                } else {
                    // Update only access token, preserve existing refresh token
                    const { error: updateError } = await supabase
                        .from('gmail_tokens')
                        .update({
                            access_token: session.provider_token,
                            expires_at: expiresAt.toISOString()
                        })
                        .eq('user_id', user.id)

                    if (updateError) {
                        console.error('[Auth Callback] Update failed:', updateError)
                    } else {
                        console.log('[Auth Callback] Access token updated')
                    }
                }
            } else {
                console.warn('[Auth Callback] No provider_token in session!')
            }
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
