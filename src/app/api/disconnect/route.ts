// src/app/api/disconnect/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Revoke the Google grant at Google's end and delete the stored tokens.
// The token is best revoked with the refresh token (kills the whole grant).
async function revokeGoogleGrant(token: string) {
    try {
        await fetch('https://oauth2.googleapis.com/revoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ token }),
        })
    } catch (e) {
        // Revocation is best-effort; we still delete our copy of the tokens.
        console.error('[Disconnect] Google revoke failed:', e)
    }
}

export async function POST() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: tokenData } = await admin
        .from('gmail_tokens')
        .select('access_token, refresh_token')
        .eq('user_id', user.id)
        .single()

    if (tokenData) {
        const token = tokenData.refresh_token || tokenData.access_token
        if (token) await revokeGoogleGrant(token)
        await admin.from('gmail_tokens').delete().eq('user_id', user.id)
    }

    const { error } = await admin
        .from('profiles')
        .update({ sorting_enabled: false, gmail_status: 'disconnected' })
        .eq('id', user.id)

    if (error) {
        console.error('[Disconnect] Profile update failed:', error)
        return NextResponse.json({ error: 'internal' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
}
