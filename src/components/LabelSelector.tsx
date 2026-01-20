// src/components/LabelSelector.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface GmailLabel {
    id: string;
    name: string;
}

interface SelectedLabel {
    id: string;
    gmail_label_id: string;
    gmail_label_name: string;
}

interface Props {
    selectedLabels: SelectedLabel[];
}

export function LabelSelector({ selectedLabels }: Props) {
    const [gmailLabels, setGmailLabels] = useState<GmailLabel[]>([]);
    const [selected, setSelected] = useState<Set<string>>(
        new Set(selectedLabels.map(l => l.gmail_label_id))
    );
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const fetchLabels = useCallback(async (isManual = false) => {
        if (isManual) setSyncing(true);
        const { data: { session } } = await supabase.auth.getSession();

        const { data } = await supabase.functions.invoke('fetch-labels', {
            headers: { Authorization: `Bearer ${session?.access_token}` }
        });

        if (data?.labels) {
            setGmailLabels(data.labels);
        }
        setSyncing(false);
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchLabels();
    }, [fetchLabels]);

    const handleToggleLabel = async (label: GmailLabel) => {
        const { data: { user } } = await supabase.auth.getUser();
        const isSelected = selected.has(label.id);

        if (isSelected) {
            // Remove
            await supabase
                .from('selected_labels')
                .delete()
                .eq('user_id', user?.id)
                .eq('gmail_label_id', label.id);

            setSelected(prev => {
                const next = new Set(prev);
                next.delete(label.id);
                return next;
            });
        } else {
            // Add
            await supabase
                .from('selected_labels')
                .insert({
                    user_id: user?.id,
                    gmail_label_id: label.id,
                    gmail_label_name: label.name
                });

            setSelected(prev => new Set([...prev, label.id]));
        }

        router.refresh();
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-mono text-slate-400 uppercase tracking-wider">
                    Labels for Sorting
                </h2>
                <button
                    onClick={() => fetchLabels(true)}
                    disabled={syncing}
                    className="text-slate-500 hover:text-emerald-400 text-sm font-mono
                               transition-colors disabled:opacity-50"
                >
                    {syncing ? '...' : '↻ Sync'}
                </button>
            </div>

            {loading ? (
                <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-6">
                    <p className="text-slate-500 font-mono text-sm animate-pulse">
                        Loading labels...
                    </p>
                </div>
            ) : gmailLabels.length === 0 ? (
                <div className="bg-slate-900/30 border border-dashed border-slate-700 rounded-lg p-6">
                    <p className="text-slate-500 font-mono text-sm text-center">
                        No labels found in Gmail.
                        <br />
                        <span className="text-slate-600">Create labels in Gmail first.</span>
                    </p>
                </div>
            ) : (
                <div className="bg-slate-900/30 border border-slate-800 rounded-lg divide-y divide-slate-800/50">
                    {gmailLabels.map(label => (
                        <button
                            key={label.id}
                            onClick={() => handleToggleLabel(label)}
                            className="w-full flex items-center gap-3 p-4 hover:bg-slate-800/30 
                                       transition-colors text-left"
                        >
                            <div
                                className={`
                                    w-5 h-5 rounded border-2 flex items-center justify-center
                                    transition-all duration-200
                                    ${selected.has(label.id)
                                        ? 'bg-emerald-500/20 border-emerald-500'
                                        : 'border-slate-600'
                                    }
                                `}
                            >
                                {selected.has(label.id) && (
                                    <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                )}
                            </div>
                            <span className={`
                                font-mono text-sm
                                ${selected.has(label.id) ? 'text-slate-200' : 'text-slate-400'}
                            `}>
                                {label.name}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {selected.size === 0 && gmailLabels.length > 0 && (
                <p className="text-amber-500/70 text-xs font-mono mt-3">
                    Select at least one label to enable sorting
                </p>
            )}
        </div>
    );
}
