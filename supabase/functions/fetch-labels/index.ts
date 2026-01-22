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
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
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
                JSON.stringify({ error: 'Gmail not connected' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Refresh token if needed
        let accessToken = tokenData.access_token;
        if (new Date(tokenData.expires_at) < new Date()) {
            console.log(`[fetch-labels] refreshing token...`);
            accessToken = await refreshToken(tokenData.refresh_token, supabase, user.id);
        }

        // Fetch Gmail labels
        const response = await fetch(
            'https://gmail.googleapis.com/gmail/v1/users/me/labels',
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

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
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

async function refreshToken(refreshToken: string, supabase: any, userId: string): Promise<string> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
            client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
            refresh_token: refreshToken,
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

    throw new Error('Failed to refresh token');
}
