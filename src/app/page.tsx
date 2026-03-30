'use client'

import { useEffect } from "react";
import { LoginButton } from "@/components/LoginButton";

export default function Home() {
  useEffect(() => {
    const section = document.querySelector('.howitworks-section');
    const cards = document.querySelectorAll('.howitworks-card');
    const title = document.querySelector('.section-title');

    // Observe individual cards/title to toggle their own visibility
    const itemObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          el.classList.add('visible');
        } else {
          el.classList.remove('visible');
        }
      });
    }, { threshold: 0.2 });

    cards.forEach((c, i) => {
      (c as HTMLElement).style.transitionDelay = `${i * 150}ms`;
      itemObserver.observe(c);
    });

    if (title) itemObserver.observe(title as Element);

    // Observe section as a whole to fade section in/out and force-hide items when leaving viewport
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          el.classList.add('section-visible');
        } else {
          el.classList.remove('section-visible');
          // Ensure items fade out as section leaves view
          title && (title as HTMLElement).classList.remove('visible');
          cards.forEach((c) => (c as HTMLElement).classList.remove('visible'));
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -10% 0px' });

    if (section) sectionObserver.observe(section as Element);

    return () => {
      itemObserver.disconnect();
      sectionObserver.disconnect();
    };
  }, []);

  return (
    <main className="flex flex-col bg-black relative overflow-hidden text-slate-200">
      {/* Scanline */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)'
        }}
      />

      {/* Hero Section */}
      <section className="hero-section z-10 text-center space-y-8 p-6">
        <h1 className="text-6xl font-mono font-bold text-emerald-400 mb-2">
          SORTD<span className="text-fuchsia-500 cursor-blink">_</span>
        </h1>
        <p className="text-slate-500 font-mono text-lg tracking-widest uppercase">
          Ultra Minimal AI Email Sorting
        </p>

        <div className="mt-6">
          <LoginButton />
        </div>

        {/* Scroll hint */}
        <div className="scroll-hint" aria-hidden="true">
          <span>SCROLL</span>
          <div className="scroll-line"></div>
        </div>
      </section>

      {/* How it works section */}
      <section aria-labelledby="how-it-works" className="howitworks-section w-full">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center mb-10 md:mb-14">
            <h2 id="how-it-works" className="section-title font-mono">HOW IT WORKS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7 lg:gap-10 items-stretch relative">
            {/* Step 1 */}
            <div className="howitworks-card">
              <div className="step-badge font-mono">01</div>
              <div className="icon-wrapper">
                <img src="/window.svg" width={20} height={20} alt="Gmail labels icon" />
              </div>
              <h3 className="card-title">Your Gmail labels</h3>
              <p className="card-desc">
                <span className="hi">Connects</span> Sortd to Gmail and uses the labels you already have.
              </p>
            </div>

            {/* Connector 1 (desktop only) */}
            <div className="connector hidden md:block" aria-hidden="true">
              <div className="connector-line">
                <span className="connector-dot" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="howitworks-card">
              <div className="step-badge font-mono">02</div>
              <div className="icon-wrapper">
                <img src="/globe.svg" width={20} height={20} alt="AI analysis icon" />
              </div>
              <h3 className="card-title">Sortd AI analysis</h3>
              <p className="card-desc">
                Sortd <span className="hi">analyzes</span> the content of your unread emails to understand context.
              </p>
            </div>

            {/* Connector 2 (desktop only) */}
            <div className="connector hidden md:block" aria-hidden="true">
              <div className="connector-line">
                <span className="connector-dot" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="howitworks-card">
              <div className="step-badge font-mono">03</div>
              <div className="icon-wrapper">
                <img src="/file.svg" width={20} height={20} alt="Automatic labeling icon" />
              </div>
              <h3 className="card-title">Automatic labeling</h3>
              <p className="card-desc">
                Sortd <span className="hi">applies</span> the right labels so your inbox organizes itself.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
