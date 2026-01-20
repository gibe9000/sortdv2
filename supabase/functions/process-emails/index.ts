// supabase/functions/process-emails/index.ts
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

        // Get all users with sorting enabled
        const { data: users } = await supabase
            .from('profiles')
            .select('id')
            .eq('sorting_enabled', true);

        if (!users?.length) {
            return new Response(
                JSON.stringify({ message: 'No active users' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const results = [];

        for (const user of users) {
            try {
                const processed = await processUserEmails(supabase, user.id);
                results.push({ userId: user.id, processed });
            } catch (error) {
                results.push({ userId: user.id, error: error.message });
            }
        }

        return new Response(
            JSON.stringify({ results }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});

async function processUserEmails(supabase: any, userId: string): Promise<number> {
    // Get tokens
    const { data: tokenData } = await supabase
        .from('gmail_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (!tokenData) throw new Error('No tokens');

    // Refresh if needed
    let accessToken = tokenData.access_token;
    if (new Date(tokenData.expires_at) < new Date()) {
        accessToken = await refreshToken(tokenData.refresh_token, supabase, userId);
    }

    // Get user's selected labels
    const { data: selectedLabels } = await supabase
        .from('selected_labels')
        .select('*')
        .eq('user_id', userId);

    if (!selectedLabels?.length) return 0;

    // Fetch unread emails without any of the selected labels
    const labelIds = selectedLabels.map((l: any) => l.gmail_label_id);
    const excludeQuery = labelIds.map((id: string) => `-label:${id}`).join(' ');

    const listResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread ${excludeQuery}&maxResults=20`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const listData = await listResponse.json();
    const messages = listData.messages || [];

    let processedCount = 0;

    for (const msg of messages) {
        // Check if already processed
        const { data: existing } = await supabase
            .from('processed_emails')
            .select('gmail_message_id')
            .eq('user_id', userId)
            .eq('gmail_message_id', msg.id)
            .single();

        if (existing) continue;

        // Get email details
        const detailResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const email = await detailResponse.json();
        const headers = email.payload?.headers || [];

        const emailData = {
            subject: headers.find((h: any) => h.name === 'Subject')?.value || '',
            from: headers.find((h: any) => h.name === 'From')?.value || '',
            snippet: email.snippet || ''
        };

        // Call Gemini to categorize
        const matchedLabel = await categorizeEmail(emailData, selectedLabels);

        if (matchedLabel) {
            // Apply label in Gmail
            await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}/modify`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        addLabelIds: [matchedLabel.gmail_label_id]
                    })
                }
            );
        }

        // Record as processed
        await supabase.from('processed_emails').insert({
            user_id: userId,
            gmail_message_id: msg.id,
            label_id: matchedLabel?.gmail_label_id || null
        });

        processedCount++;
    }

    // Update stats
    await supabase
        .from('profiles')
        .update({
            emails_processed: supabase.rpc('increment_processed', { count: processedCount }),
            last_processed_at: new Date().toISOString()
        })
        .eq('id', userId);

    // Actually, simpler update:
    const { data: profile } = await supabase
        .from('profiles')
        .select('emails_processed')
        .eq('id', userId)
        .single();

    await supabase
        .from('profiles')
        .update({
            emails_processed: (profile?.emails_processed || 0) + processedCount,
            last_processed_at: new Date().toISOString()
        })
        .eq('id', userId);

    return processedCount;
}

async function categorizeEmail(
    email: { subject: string; from: string; snippet: string },
    labels: Array<{ gmail_label_id: string; gmail_label_name: string }>
): Promise<{ gmail_label_id: string; gmail_label_name: string } | null> {

    const prompt = `You are an email categorizer. Based on the email below, determine which label fits best.

AVAILABLE LABELS:
${labels.map(l => `- ${l.gmail_label_name}`).join('\n')}

EMAIL:
Subject: ${email.subject}
From: ${email.from}
Preview: ${email.snippet}

Respond with ONLY the exact label name that fits best, or "NONE" if no label fits.`;

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 50
                }
            })
        }
    );

    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'NONE';

    if (result === 'NONE') return null;

    // Find matching label
    const matched = labels.find(
        l => l.gmail_label_name.toLowerCase() === result.toLowerCase()
    );

    return matched || null;
}

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
