// src/app/api/account/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Permanently delete the user's account. Revokes the Google grant, then
// deletes the auth user - profiles, gmail_tokens, selected_labels and
// processed_emails all cascade via their foreign keys.
export async function DELETE() {
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

    const token = tokenData?.refresh_token || tokenData?.access_token
    if (token) {
        try {
            await fetch('https://oauth2.googleapis.com/revoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ token }),
            })
        } catch (e) {
            console.error('[Delete Account] Google revoke failed:', e)
        }
    }

    const { error } = await admin.auth.admin.deleteUser(user.id)

    if (error) {
        console.error('[Delete Account] deleteUser failed:', error)
        return NextResponse.json({ error: 'internal' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
}
