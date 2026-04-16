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

            // Check for Google tokens and store them if they exist in the session

            const { data: { session } } = await supabase.auth.getSession()
            if (session?.provider_token && session?.provider_refresh_token && session?.user) {

                const { data: { session: fullSession } } = await supabase.auth.getSession();
                if (fullSession?.provider_token) {
                    const user = fullSession.user;
                    console.log('[Auth Callback] Saving tokens for user:', user.id);

                    const expiresAt = new Date();
                    expiresAt.setSeconds(expiresAt.getSeconds() + (fullSession.expires_in || 3600));

                    const { error: upsertError } = await supabase.from('gmail_tokens').upsert({
                        user_id: user.id,
                        access_token: fullSession.provider_token,
                        refresh_token: fullSession.provider_refresh_token || '',
                        expires_at: expiresAt.toISOString()
                    });

                    if (upsertError) {
                        console.error('[Auth Callback] Token upsert failed:', upsertError);
                    } else {
                        console.log('[Auth Callback] Tokens saved successfully.');
                    }
                } else {
                    console.warn('[Auth Callback] No provider_token found in session.');
                }
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
