// src/components/LabelSelector.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LabelSuggestions, CreatedLabel } from '@/components/LabelSuggestions';

interface GmailLabel {
    id: string;
    name: string;
}

interface SelectedLabel {
    id: string;
    gmail_label_id: string;
    gmail_label_name: string;
    description?: string | null;
    archive_on_label?: boolean;
}

interface LabelSettings {
    description: string;
    archiveOnLabel: boolean;
}

interface Props {
    selectedLabels: SelectedLabel[];
}

export function LabelSelector({ selectedLabels }: Props) {
    const [gmailLabels, setGmailLabels] = useState<GmailLabel[]>([]);
    const [selected, setSelected] = useState<Set<string>>(
        new Set(selectedLabels.map(l => l.gmail_label_id))
    );
    const [settings, setSettings] = useState<Map<string, LabelSettings>>(
        new Map(selectedLabels.map(l => [
            l.gmail_label_id,
            { description: l.description ?? '', archiveOnLabel: l.archive_on_label ?? false }
        ]))
    );
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const fetchLabels = useCallback(async (isManual = false) => {
        if (isManual) setSyncing(true);
        setLoadError(false);
        const { data: { session } } = await supabase.auth.getSession();

        const { data, error } = await supabase.functions.invoke('fetch-labels', {
            headers: { Authorization: `Bearer ${session?.access_token}` }
        });

        if (data?.labels) {
            setGmailLabels(data.labels);
        } else if (error) {
            setLoadError(true);
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
            setSettings(prev => {
                const next = new Map(prev);
                if (!next.has(label.id)) next.set(label.id, { description: '', archiveOnLabel: false });
                return next;
            });
        }

        router.refresh();
    };

    const saveDescription = async (labelId: string, description: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase
            .from('selected_labels')
            .update({ description: description.trim() || null })
            .eq('user_id', user?.id)
            .eq('gmail_label_id', labelId);
    };

    const handleToggleArchive = async (labelId: string) => {
        const current = settings.get(labelId);
        const newValue = !(current?.archiveOnLabel ?? false);

        setSettings(prev => {
            const next = new Map(prev);
            next.set(labelId, { description: current?.description ?? '', archiveOnLabel: newValue });
            return next;
        });

        const { data: { user } } = await supabase.auth.getUser();
        await supabase
            .from('selected_labels')
            .update({ archive_on_label: newValue })
            .eq('user_id', user?.id)
            .eq('gmail_label_id', labelId);
    };

    const handleDescriptionChange = (labelId: string, description: string) => {
        setSettings(prev => {
            const next = new Map(prev);
            const current = next.get(labelId);
            next.set(labelId, { description, archiveOnLabel: current?.archiveOnLabel ?? false });
            return next;
        });
    };

    // Labels created via AI suggestions arrive already selected server-side;
    // reflect that in local state without waiting for a refetch.
    const handleSuggestionsCreated = (created: CreatedLabel[]) => {
        setGmailLabels(prev => {
            const known = new Set(prev.map(l => l.id));
            return [...prev, ...created.filter(c => !known.has(c.id)).map(c => ({ id: c.id, name: c.name }))];
        });
        setSelected(prev => new Set([...prev, ...created.map(c => c.id)]));
        setSettings(prev => {
            const next = new Map(prev);
            for (const c of created) {
                next.set(c.id, { description: c.description ?? '', archiveOnLabel: false });
            }
            return next;
        });
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
            ) : loadError ? (
                <div className="bg-slate-900/30 border border-red-500/30 rounded-lg p-6 text-center">
                    <p className="text-red-400 font-mono text-sm">
                        Couldn&apos;t load your Gmail labels.
                    </p>
                    <button
                        onClick={() => fetchLabels(true)}
                        className="mt-3 text-slate-400 hover:text-emerald-400 font-mono text-sm underline transition-colors"
                    >
                        Retry
                    </button>
                </div>
            ) : gmailLabels.length === 0 ? (
                <div>
                    <div className="bg-slate-900/30 border border-dashed border-slate-700 rounded-lg p-6">
                        <p className="text-slate-500 font-mono text-sm text-center">
                            No labels found in Gmail.
                            <br />
                            <span className="text-slate-600">
                                Let Sortd suggest some based on your recent email.
                            </span>
                        </p>
                    </div>
                    <LabelSuggestions hasGmailLabels={false} onCreated={handleSuggestionsCreated} />
                </div>
            ) : (
                <div className="bg-slate-900/30 border border-slate-800 rounded-lg divide-y divide-slate-800/50">
                    {gmailLabels.map(label => {
                        const isSelected = selected.has(label.id);
                        const labelSettings = settings.get(label.id);
                        return (
                            <div key={label.id}>
                                <button
                                    onClick={() => handleToggleLabel(label)}
                                    className="w-full flex items-center gap-3 p-4 hover:bg-slate-800/30
                                               transition-colors text-left"
                                >
                                    <div
                                        className={`
                                            w-5 h-5 rounded border-2 flex items-center justify-center
                                            transition-all duration-200
                                            ${isSelected
                                                ? 'bg-emerald-500/20 border-emerald-500'
                                                : 'border-slate-600'
                                            }
                                        `}
                                    >
                                        {isSelected && (
                                            <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className={`
                                        font-mono text-sm
                                        ${isSelected ? 'text-slate-200' : 'text-slate-400'}
                                    `}>
                                        {label.name}
                                    </span>
                                </button>

                                {/* Per-label settings, shown when selected */}
                                {isSelected && (
                                    <div className="px-4 pb-4 pl-12 space-y-2">
                                        <input
                                            type="text"
                                            value={labelSettings?.description ?? ''}
                                            onChange={(e) => handleDescriptionChange(label.id, e.target.value)}
                                            onBlur={(e) => saveDescription(label.id, e.target.value)}
                                            placeholder="Describe what belongs here (improves AI accuracy)"
                                            maxLength={200}
                                            className="w-full bg-slate-900/60 border border-slate-700 rounded px-3 py-2
                                                       text-slate-300 font-mono text-xs placeholder-slate-600
                                                       focus:outline-none focus:border-emerald-500/60"
                                        />
                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={labelSettings?.archiveOnLabel ?? false}
                                                onChange={() => handleToggleArchive(label.id)}
                                                className="accent-emerald-500"
                                            />
                                            <span className="text-slate-500 font-mono text-xs">
                                                Skip inbox (archive when labelled)
                                            </span>
                                        </label>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {selected.size === 0 && gmailLabels.length > 0 && !loadError && (
                <p className="text-amber-500/70 text-xs font-mono mt-3">
                    Select at least one label to enable sorting
                </p>
            )}

            {gmailLabels.length > 0 && !loading && !loadError && (
                <LabelSuggestions hasGmailLabels={true} onCreated={handleSuggestionsCreated} />
            )}
        </div>
    );
}
