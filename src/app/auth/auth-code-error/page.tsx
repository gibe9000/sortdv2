// src/app/auth/auth-code-error/page.tsx
import Link from 'next/link';

export default function AuthCodeError() {
    return (
        <div className="min-h-screen bg-[#0a0a0f] text-slate-200 flex items-center justify-center p-6">
            <div className="max-w-md text-center space-y-6">
                <h1 className="text-2xl font-mono font-bold text-emerald-400">
                    SORTD<span className="text-fuchsia-500">_</span>
                </h1>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 space-y-3">
                    <p className="text-red-400 font-mono text-sm font-bold uppercase tracking-wider">
                        Sign-in failed
                    </p>
                    <p className="text-slate-400 text-sm">
                        Something went wrong while connecting your Google account.
                        This can happen if the sign-in was cancelled or timed out.
                    </p>
                </div>
                <Link
                    href="/"
                    className="inline-block px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black
                               font-mono font-bold text-sm uppercase tracking-wider transition-colors"
                >
                    Try again
                </Link>
            </div>
        </div>
    );
}
