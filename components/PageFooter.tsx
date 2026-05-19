'use client';

import { useState } from 'react';
/* FooterAscii removed — PageAscii at the page level provides the drift. */

/**
 * PageFooter — stripped-down contact strip at the bottom of the page.
 *
 * No marquee headline, no pitch paragraph — just the actions:
 *   1. Email displayed as plain text + copy-to-clipboard button
 *   2. GET IN TOUCH (mailto)
 *   3. DOWNLOAD RESUME (PDF)
 *   4. Socials row (also here →)
 *
 * Sits behind the FooterAscii drift layer so the ASCII characters can
 * travel across the section background.
 */

const EMAIL = 'jacquelinegiale@gmail.com';

export default function PageFooter() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      aria-label="Contact + resume"
      className="relative w-full px-6 pb-16 pt-2"
    >
      {/* Page-level <PageAscii /> handles the drift behind this section. */}

      {/* BIG COLORED PILL — fully rounded ombre that matches the page
          palette (peach → ember → lavender). The whole thing reads as
          one capsule, not a flat card. */}
      <div className="relative mx-auto max-w-[760px]" style={{ zIndex: 1 }}>
        <div
          className="relative overflow-hidden"
          style={{
            // Fully-rounded pill (very large radius pinned to the card height).
            borderRadius: 9999,
            // Multi-stop ombre using the project's existing palette tokens.
            background: `
              radial-gradient(ellipse 60% 80% at 15% 30%, rgba(255,214,194,0.95) 0%, transparent 65%),
              radial-gradient(ellipse 70% 90% at 85% 75%, rgba(217,199,238,0.85) 0%, transparent 65%),
              radial-gradient(ellipse 55% 70% at 50% 95%, rgba(244,168,193,0.55) 0%, transparent 70%),
              linear-gradient(135deg, #FFD6C2 0%, #F4A8C1 45%, #D9C7EE 100%)
            `,
            border: '1px solid rgba(255,255,255,0.7)',
            boxShadow: `
              inset 0 1.5px 0 rgba(255,255,255,0.85),
              inset 0 -1.5px 0 rgba(63,31,45,0.08),
              0 22px 48px -20px rgba(255,90,44,0.35),
              0 8px 20px -12px rgba(63,31,45,0.25)
            `,
          }}
        >
          {/* Soft paper grain — keeps the ombre from feeling plastic. */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'180\' height=\'180\'><filter id=\'g\'><feTurbulence baseFrequency=\'0.95\' numOctaves=\'2\' seed=\'4\'/><feColorMatrix values=\'0 0 0 0 0.25  0 0 0 0 0.18  0 0 0 0 0.18  0 0 0 0.12 0\'/></filter><rect width=\'180\' height=\'180\' filter=\'url(%23g)\'/></svg>")',
              opacity: 0.32,
              mixBlendMode: 'multiply',
            }}
          />
          {/* Top-edge highlight to give the pill a glassy sheen */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: '40%',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)',
            }}
          />

          <div className="relative flex flex-col items-center text-center px-8 md:px-14 py-10 md:py-14">
            {/* Tiny eyebrow */}
            <p
              className="font-mono text-[10px] tracking-[0.32em] uppercase mb-4"
              style={{ color: 'var(--ember-600)' }}
            >
              ✦ let&apos;s talk ✦
            </p>

            {/* Big italic display headline — colored to land in the pill */}
            <h2
              className="font-display italic leading-[1.02] mb-5"
              style={{ color: 'var(--plum-700)', fontSize: 'clamp(30px,4.6vw,52px)' }}
            >
              find me at.
            </h2>

            {/* Email pill + copy — sits on a frosted white sub-pill */}
            <div
              className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.55)',
                border: '1px solid rgba(255,255,255,0.85)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 12px -6px rgba(63,31,45,0.2)',
              }}
            >
              <span
                className="font-mono text-[12px] md:text-[13px] tracking-[0.04em] px-4 py-2.5 rounded-full select-all"
                style={{
                  color: 'var(--plum-700)',
                }}
              >
                {EMAIL}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="font-mono text-[10.5px] tracking-[0.22em] uppercase px-4 py-2.5 rounded-full transition-colors"
                style={{
                  background: copied
                    ? 'rgba(255,90,44,0.18)'
                    : 'rgba(63,31,45,0.92)',
                  color: copied ? 'var(--ember-600)' : '#fdf9f2',
                  boxShadow: '0 4px 10px -6px rgba(63,31,45,0.55)',
                }}
                aria-live="polite"
              >
                {copied ? '✓ copied' : '⎘ copy'}
              </button>
            </div>

            {/* Primary action row */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href={`mailto:${EMAIL}?subject=Saw%20your%20portfolio`}
                className="font-mono text-[11px] tracking-[0.22em] uppercase px-7 py-3.5 rounded-full transition-transform hover:-translate-y-0.5"
                style={{
                  background:
                    'linear-gradient(135deg, var(--ember-500) 0%, var(--rust-600) 100%)',
                  color: '#fdf9f2',
                  boxShadow:
                    '0 12px 24px -10px rgba(255,90,44,0.65), inset 0 1px 0 rgba(255,255,255,0.45)',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                get in touch
              </a>
              <a
                href="/resume.pdf"
                download
                className="font-mono text-[11px] tracking-[0.22em] uppercase px-7 py-3.5 rounded-full transition-transform hover:-translate-y-0.5"
                style={{
                  background: 'rgba(253,249,242,0.85)',
                  color: 'var(--plum-700)',
                  border: '1px solid rgba(63,31,45,0.22)',
                  boxShadow:
                    '0 10px 22px -12px rgba(63,31,45,0.35), inset 0 1px 0 rgba(255,255,255,0.8)',
                }}
              >
                ↓ download resume
              </a>
            </div>

            {/* Socials */}
            <div
              className="mt-7 pt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[10px] md:text-[11px] tracking-[0.18em] uppercase"
              style={{
                borderTop: '1px dashed rgba(63,31,45,0.22)',
                color: 'var(--plum-700)',
                width: '100%',
                maxWidth: 560,
              }}
            >
              <span style={{ color: 'rgba(63,31,45,0.55)' }}>also here →</span>
              <FooterSocial label="tg" handle="@ijackie_eth" href="https://t.me/ijackie_eth" />
              <FooterSocial label="twitter" handle="@berakana_" href="https://twitter.com/berakana_" />
              <FooterSocial label="linkedin" handle="/jacquelinemach" href="https://linkedin.com/in/jacquelinemach" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FooterSocial({
  label,
  handle,
  href,
}: {
  label: string;
  handle: string;
  href: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span style={{ color: 'rgba(63,31,45,0.45)' }}>{label}:</span>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-ember-500 transition-colors underline-offset-4 hover:underline"
        style={{ color: 'rgba(63,31,45,0.8)' }}
      >
        {handle}
      </a>
    </span>
  );
}
