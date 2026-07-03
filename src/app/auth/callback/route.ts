import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser()

            if (userError) {
                console.error('[Auth Callback] Failed to fetch authenticated user:', userError)
            }

            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession()

            if (sessionError) {
                console.error('[Auth Callback] Failed to fetch session:', sessionError)
            }

            const authenticatedUser = user ?? session?.user

            if (authenticatedUser) {
                const { error: profileUpsertError } = await supabase
                    .from('profiles')
                    .upsert(
                        {
                            id: authenticatedUser.id,
                            email: authenticatedUser.email ?? '',
                        },
                        { onConflict: 'id' }
                    )

                if (profileUpsertError) {
                    console.error('[Auth Callback] Profile upsert failed:', profileUpsertError)
                }
            }

            if (session?.provider_token && authenticatedUser) {
                console.log('[Auth Callback] Saving Google tokens for user:', authenticatedUser.id)

                // Google access tokens live ~1 hour. session.expires_in is the
                // Supabase session's expiry, not the Google token's - don't use it here.
                const expiresAt = new Date()
                expiresAt.setSeconds(expiresAt.getSeconds() + 3600)

                // Google only returns a refresh token on consent. Never overwrite a
                // stored refresh token with an empty value on re-login.
                const tokenRow: Record<string, string> = {
                    user_id: authenticatedUser.id,
                    access_token: session.provider_token,
                    expires_at: expiresAt.toISOString(),
                }
                if (session.provider_refresh_token) {
                    tokenRow.refresh_token = session.provider_refresh_token
                }

                const { error: upsertError } = await supabase
                    .from('gmail_tokens')
                    .upsert(tokenRow, { onConflict: 'user_id' })

                if (upsertError) {
                    console.error('[Auth Callback] Token upsert failed:', upsertError)
                } else {
                    console.log('[Auth Callback] Tokens saved successfully.')
                    // A fresh grant means the connection is healthy again
                    const { error: statusError } = await supabase
                        .from('profiles')
                        .update({ gmail_status: 'connected' })
                        .eq('id', authenticatedUser.id)
                    if (statusError) {
                        console.error('[Auth Callback] Failed to reset gmail_status:', statusError)
                    }
                }
            } else {
                console.warn('[Auth Callback] Missing provider_token or authenticated user after OAuth callback.')
            }

            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'
            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
