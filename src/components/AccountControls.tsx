// src/components/AccountControls.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AccountControls() {
    const router = useRouter();
    const supabase = createClient();
    const [busy, setBusy] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleSignOut = async () => {
        setBusy('signout');
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    const handleDisconnect = async () => {
        setBusy('disconnect');
        const res = await fetch('/api/disconnect', { method: 'POST' });
        setBusy(null);
        if (res.ok) {
            router.refresh();
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirmDelete) {
            setConfirmDelete(true);
            // Reset the confirm state if they don't follow through
            setTimeout(() => setConfirmDelete(false), 5000);
            return;
        }
        setBusy('delete');
        const res = await fetch('/api/account', { method: 'DELETE' });
        if (res.ok) {
            await supabase.auth.signOut();
            router.push('/');
            router.refresh();
        } else {
            setBusy(null);
            setConfirmDelete(false);
        }
    };

    return (
        <div className="flex items-center justify-between gap-4 flex-wrap">
            <button
                onClick={handleSignOut}
                disabled={busy !== null}
                className="text-slate-500 hover:text-slate-300 text-sm font-mono
                           transition-colors disabled:opacity-50"
            >
                Sign out
            </button>

            <div className="flex items-center gap-4">
                <button
                    onClick={handleDisconnect}
                    disabled={busy !== null}
                    title="Revokes Sortd's access to your Gmail and deletes the stored tokens"
                    className="text-slate-500 hover:text-amber-400 text-sm font-mono
                               transition-colors disabled:opacity-50"
                >
                    {busy === 'disconnect' ? '...' : 'Disconnect Gmail'}
                </button>

                <button
                    onClick={handleDeleteAccount}
                    disabled={busy === 'delete' || busy === 'signout'}
                    title="Deletes your account and all data permanently"
                    className={`text-sm font-mono transition-colors disabled:opacity-50 ${
                        confirmDelete
                            ? 'text-red-400 font-bold'
                            : 'text-slate-600 hover:text-red-400'
                    }`}
                >
                    {busy === 'delete'
                        ? 'Deleting...'
                        : confirmDelete
                            ? 'Click again to confirm'
                            : 'Delete account'}
                </button>
            </div>
        </div>
    );
}
