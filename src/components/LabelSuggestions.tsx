// src/components/LabelSuggestions.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

interface Suggestion {
    name: string;
    description: string;
}

export interface CreatedLabel {
    id: string;
    name: string;
    description: string | null;
}

interface Props {
    hasGmailLabels: boolean;
    onCreated: (created: CreatedLabel[]) => void;
}

type Phase = 'idle' | 'suggesting' | 'review' | 'creating' | 'error';

export function LabelSuggestions({ hasGmailLabels, onCreated }: Props) {
    const [phase, setPhase] = useState<Phase>('idle');
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [checked, setChecked] = useState<Set<number>>(new Set());
    const [errorMsg, setErrorMsg] = useState('');
    // Paging through the mailbox, 50 emails per round
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    // Names the user has passed on this session - never suggested again
    const [rejected, setRejected] = useState<string[]>([]);
    const supabase = createClient();

    const invoke = async (body: object) => {
        const { data: { session } } = await supabase.auth.getSession();
        return supabase.functions.invoke('suggest-labels', {
            body,
            headers: { Authorization: `Bearer ${session?.access_token}` },
        });
    };

    const runSuggest = async (opts: { pageToken?: string | null; extraRejected?: string[] }) => {
        setPhase('suggesting');
        setErrorMsg('');

        const excludeList = [...rejected, ...(opts.extraRejected ?? [])];
        if (opts.extraRejected?.length) setRejected(excludeList);

        const { data, error } = await invoke({
            action: 'suggest',
            ...(opts.pageToken ? { pageToken: opts.pageToken } : {}),
            ...(excludeList.length ? { exclude: excludeList } : {}),
        });

        if (error || !Array.isArray(data?.suggestions)) {
            setErrorMsg(
                data?.error === 'not_enough_emails'
                    ? 'Not enough recent emails to analyze yet.'
                    : data?.error === 'no_more_emails'
                        ? "That's the whole mailbox - no more emails to analyze."
                        : data?.error === 'rate_limit'
                            ? 'The AI is busy right now - try again in a minute.'
                            : "Couldn't generate suggestions. Try again."
            );
            setPhase('error');
            return;
        }

        setNextPageToken(data.nextPageToken ?? null);

        if (data.suggestions.length === 0) {
            setErrorMsg(
                opts.pageToken
                    ? 'No new label ideas in that batch of older mail either.'
                    : 'Your existing labels already cover your recent email - nothing new to suggest.'
            );
            setPhase('error');
            return;
        }

        setSuggestions(data.suggestions);
        setChecked(new Set(data.suggestions.map((_: Suggestion, i: number) => i)));
        setPhase('review');
    };

    const handleSuggest = () => runSuggest({ pageToken: nextPageToken });

    // Reject everything on screen and analyze the next 50 older emails
    const handleMoreSuggestions = () =>
        runSuggest({
            pageToken: nextPageToken,
            extraRejected: suggestions.map(s => s.name),
        });

    const toggleSuggestion = (index: number) => {
        setChecked(prev => {
            const next = new Set(prev);
            if (next.has(index)) next.delete(index);
            else next.add(index);
            return next;
        });
    };

    const handleCreate = async () => {
        const chosen = suggestions.filter((_, i) => checked.has(i));
        if (chosen.length === 0) return;

        // Unchecked ideas count as rejected for future rounds
        const passed = suggestions.filter((_, i) => !checked.has(i)).map(s => s.name);
        if (passed.length) setRejected(prev => [...prev, ...passed]);

        setPhase('creating');
        const { data, error } = await invoke({ action: 'create', labels: chosen });

        if (error || !data?.created?.length) {
            setErrorMsg("Couldn't create the labels in Gmail. Try again.");
            setPhase('error');
            return;
        }

        setPhase('idle');
        setSuggestions([]);
        onCreated(data.created as CreatedLabel[]);
    };

    if (phase === 'suggesting' || phase === 'creating') {
        return (
            <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-6">
                <p className="text-emerald-400/80 font-mono text-sm animate-pulse">
                    {phase === 'suggesting'
                        ? '✨ Analyzing your emails...'
                        : '✨ Creating labels in your Gmail...'}
                </p>
            </div>
        );
    }

    if (phase === 'review') {
        return (
            <div className="bg-slate-900/30 border border-emerald-500/30 rounded-lg p-4">
                <p className="text-slate-300 font-mono text-sm mb-3">
                    ✨ Suggested labels — uncheck what you don&apos;t want:
                </p>
                <div className="space-y-2 mb-4">
                    {suggestions.map((s, i) => (
                        <label
                            key={i}
                            className="flex items-start gap-3 p-2 rounded hover:bg-slate-800/30 cursor-pointer select-none"
                        >
                            <input
                                type="checkbox"
                                checked={checked.has(i)}
                                onChange={() => toggleSuggestion(i)}
                                className="mt-1 accent-emerald-500"
                            />
                            <span>
                                <span className="text-slate-200 font-mono text-sm">{s.name}</span>
                                <span className="block text-slate-500 font-mono text-xs mt-0.5">
                                    {s.description}
                                </span>
                            </span>
                        </label>
                    ))}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={handleCreate}
                        disabled={checked.size === 0}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black
                                   font-mono text-xs font-bold uppercase tracking-wider
                                   transition-colors disabled:opacity-40"
                    >
                        Create {checked.size} label{checked.size === 1 ? '' : 's'}
                    </button>
                    <button
                        onClick={handleMoreSuggestions}
                        disabled={!nextPageToken}
                        title={nextPageToken
                            ? 'Skip these and analyze the next 50 older emails'
                            : 'No more emails to analyze'}
                        className="text-slate-400 hover:text-emerald-400 font-mono text-xs
                                   transition-colors disabled:opacity-40 disabled:hover:text-slate-400"
                    >
                        ↻ More suggestions
                    </button>
                    <button
                        onClick={() => { setPhase('idle'); setSuggestions([]); }}
                        className="text-slate-500 hover:text-slate-300 font-mono text-xs transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {phase === 'error' && (
                <p className="text-amber-400/80 font-mono text-xs mb-2">{errorMsg}</p>
            )}
            <button
                onClick={handleSuggest}
                className={`w-full font-mono text-sm transition-colors rounded-lg ${
                    hasGmailLabels
                        ? 'py-2.5 border border-dashed border-slate-700 text-slate-400 ' +
                          'hover:text-emerald-400 hover:border-emerald-500/50'
                        : 'py-3 bg-emerald-500/10 border border-emerald-500/40 ' +
                          'text-emerald-400 hover:bg-emerald-500/20 font-bold'
                }`}
            >
                {hasGmailLabels
                    ? '✨ Suggest new labels from my recent email'
                    : '✨ Suggest labels based on my recent email'}
            </button>
        </div>
    );
}
