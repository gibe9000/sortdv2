// supabase/functions/fetch-labels/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // SB_SECRET_KEY (custom secret, sb_secret_...) takes precedence; the
        // auto-injected legacy SUPABASE_SERVICE_ROLE_KEY is the fallback.
        // (Custom edge-function secrets may not start with SUPABASE_.)
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            (Deno.env.get('SB_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))!
        );

        const authHeader = req.headers.get('Authorization')!;
        const token = authHeader.replace('Bearer ', '');

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Get Gmail tokens
        const { data: tokenData } = await supabase
            .from('gmail_tokens')
            .select('*')
            .eq('user_id', user.id)
            .single();

        console.log(`[fetch-labels] User ${user.id} - Token data found: ${!!tokenData}`);

        if (!tokenData) {
            console.error(`[fetch-labels] No tokens found for user ${user.id}`);
            return new Response(
                JSON.stringify({ error: 'reconnect_required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Refresh token if needed
        let accessToken = tokenData.access_token;
        if (new Date(tokenData.expires_at) < new Date()) {
            console.log(`[fetch-labels] refreshing token...`);
            try {
                accessToken = await refreshToken(tokenData.refresh_token, supabase, user.id);
            } catch (e: any) {
                if (e.message === 'INVALID_GRANT') {
                    // Refresh token revoked/expired - flag the profile so the dashboard
                    // shows a reconnect banner instead of failing silently.
                    await supabase
                        .from('profiles')
                        .update({ gmail_status: 'reconnect_required' })
                        .eq('id', user.id);
                    return new Response(
                        JSON.stringify({ error: 'reconnect_required' }),
                        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    );
                }
                throw e;
            }
        }

        // Fetch Gmail labels
        const response = await fetch(
            'https://gmail.googleapis.com/gmail/v1/users/me/labels',
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (!response.ok) {
            console.error(`[fetch-labels] Gmail API error ${response.status}:`, await response.text());
            return new Response(
                JSON.stringify({ error: 'gmail_api_error' }),
                { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const data = await response.json();

        // Filter to user-created labels only (not system labels like INBOX, SENT, etc.)
        const userLabels = data.labels
            ?.filter((label: any) => label.type === 'user')
            .map((label: any) => ({
                id: label.id,
                name: label.name
            })) || [];

        return new Response(
            JSON.stringify({ labels: userLabels }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('[fetch-labels] Unexpected error:', error);
        return new Response(
            JSON.stringify({ error: 'internal' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

async function refreshToken(refreshTokenValue: string, supabase: any, userId: string): Promise<string> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
            client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
            refresh_token: refreshTokenValue,
            grant_type: 'refresh_token'
        })
    });

    const data = await response.json();

    if (data.access_token) {
        await supabase
            .from('gmail_tokens')
            .update({
                access_token: data.access_token,
                expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString()
            })
            .eq('user_id', userId);

        return data.access_token;
    }

    // Log error fields only - never the full response
    console.error(`[fetch-labels] Token refresh failed for user ${userId}: ${data.error} - ${data.error_description}`);

    if (data.error === 'invalid_grant') throw new Error('INVALID_GRANT');
    throw new Error('Failed to refresh token');
}
