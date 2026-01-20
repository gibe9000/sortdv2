// src/components/LogoutButton.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    return (
        <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-red-400 text-sm font-mono
                       transition-colors"
        >
            Disconnect Gmail
        </button>
    );
}
