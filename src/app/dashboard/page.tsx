// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SortingToggle } from '@/components/SortingToggle';
import { LabelSelector } from '@/components/LabelSelector';
import { LogoutButton } from '@/components/LogoutButton';
import { ReconnectBanner } from '@/components/ReconnectBanner';
import { ActivityFeed } from '@/components/ActivityFeed';

export default async function Dashboard() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // Create profile if missing (resilience)
    if (!profile) {
        // Trigger should have handled it
    }

    const { data: selectedLabels } = await supabase
        .from('selected_labels')
        .select('*')
        .eq('user_id', user.id);

    // Last labelled emails for the activity feed (no-match rows have a null label name)
    const { data: recentActivity } = await supabase
        .from('processed_emails')
        .select('gmail_message_id, subject, sender, gmail_label_name, processed_at')
        .eq('user_id', user.id)
        .not('gmail_label_name', 'is', null)
        .order('processed_at', { ascending: false })
        .limit(8);

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-slate-200">
            {/* Scanline */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.015]"
                style={{
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
                }}
            />

            <div className="relative z-10 max-w-md mx-auto p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-mono font-bold text-emerald-400">
                        SORTD<span className="text-fuchsia-500">_</span>
                    </h1>
                    <span className="text-slate-500 text-sm font-mono truncate ml-4">
                        {user.email}
                    </span>
                </div>

                {/* Gmail connection lost -> reconnect */}
                {profile?.gmail_status === 'reconnect_required' && <ReconnectBanner />}

                {/* Main Toggle Card */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 mb-6">
                    <SortingToggle
                        enabled={profile?.sorting_enabled ?? false}
                        emailsProcessed={profile?.emails_processed ?? 0}
                    />
                </div>

                {/* Label Selection */}
                <LabelSelector selectedLabels={selectedLabels ?? []} />

                {/* Activity Feed */}
                <ActivityFeed items={recentActivity ?? []} />

                {/* Footer */}
                <div className="mt-12 pt-6 border-t border-slate-800">
                    <LogoutButton />
                </div>
            </div>
        </div>
    );
}
