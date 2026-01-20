// src/components/SortingToggle.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
    enabled: boolean;
    emailsProcessed: number;
}

export function SortingToggle({ enabled, emailsProcessed }: Props) {
    const [isEnabled, setIsEnabled] = useState(enabled);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleToggle = async () => {
        setLoading(true);
        const newValue = !isEnabled;
        setIsEnabled(newValue);

        const { data: { user } } = await supabase.auth.getUser();

        await supabase
            .from('profiles')
            .update({ sorting_enabled: newValue })
            .eq('id', user?.id);

        setLoading(false);
        router.refresh();
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-mono text-slate-200">SORTING</h2>
                    {isEnabled && (
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="text-emerald-400 text-xs font-mono">ACTIVE</span>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleToggle}
                    disabled={loading}
                    className={`
                        relative w-14 h-7 rounded-full transition-all duration-300
                        ${isEnabled
                            ? 'bg-emerald-500/20 border-emerald-500/50'
                            : 'bg-slate-800 border-slate-700'
                        }
                        border disabled:opacity-50
                    `}
                >
                    <div
                        className={`
                            absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300
                            ${isEnabled
                                ? 'left-7 bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                                : 'left-0.5 bg-slate-500'
                            }
                        `}
                    />
                </button>
            </div>

            <div className="text-slate-500 text-sm font-mono">
                {emailsProcessed.toLocaleString()} emails sorted
            </div>
        </div>
    );
}
