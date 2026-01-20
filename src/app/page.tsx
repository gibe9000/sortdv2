import { LoginButton } from "@/components/LoginButton";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] relative overflow-hidden text-slate-200">
      {/* Scanline */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
        }}
      />

      <div className="z-10 text-center space-y-8 p-6">
        <h1 className="text-6xl font-mono font-bold text-emerald-400 mb-2">
          SORTD<span className="text-fuchsia-500">_</span>
        </h1>
        <p className="text-slate-500 font-mono text-lg tracking-widest uppercase">
          Ultra Minimal AI Email Sorting
        </p>

        <div className="mt-12">
          <LoginButton />
        </div>
      </div>
    </main>
  );
}
