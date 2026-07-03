// src/components/ReconnectBanner.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { googleOAuthOptions } from '@/lib/googleOAuth';
import { useState } from 'react';

export function ReconnectBanner() {
    const [loading, setLoading] = useState(false);

    const handleReconnect = async () => {
        setLoading(true);
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: googleOAuthOptions(),
        });
    };

    return (
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-amber-400 font-mono text-sm font-bold">
                        GMAIL CONNECTION LOST
                    </p>
                    <p className="text-slate-400 text-xs font-mono mt-1">
                        Sorting is paused. Reconnect your Google account to resume.
                    </p>
                </div>
                <button
                    onClick={handleReconnect}
                    disabled={loading}
                    className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black
                               font-mono text-xs font-bold uppercase tracking-wider
                               transition-colors disabled:opacity-50"
                >
                    {loading ? '...' : 'Reconnect'}
                </button>
            </div>
        </div>
    );
}
