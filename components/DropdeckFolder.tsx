'use client';

import { useState } from 'react';

/**
 * DropdeckFolder — folder 05. What Jacqueline is currently building
 * (dropdeck.xyz, a canvas-tech UGC agency): how it works, a live
 * terminal-style build log, a product peek, traction stats, and the
 * partners she's working with.
 *
 * Everything is data-driven from the arrays below:
 *   STEPS     — the 3-step "how it works" row.
 *   TRACTION  — real numbers only. Renders ONLY when non-empty.
 *   PARTNERS  — logo cards. Logos live in public/assets/partners/.
 *   PRODUCT_PEEK — screenshot of the canvas. Drop the file at
 *               public/assets/dropdeck/canvas-peek.png and the browser
 *               frame appears automatically (hidden while missing).
 *
 * (The terminal build log moved to the RESUME folder — see BuildLog.tsx.)
 */

/* ── HOW IT WORKS ───────────────────────────────────────────────────
   TODO(jacqueline): tune this copy to how dropdeck ACTUALLY works. */
const STEPS: { glyph: string; title: string; blurb: string }[] = [
  {
    glyph: '⌘',
    title: 'brands brief',
    blurb: 'Brands drop what they need — product, vibe, deadline.',
  },
  {
    glyph: '✿',
    title: 'creators make',
    blurb: 'Matched creators build content together on the canvas.',
  },
  {
    glyph: '➤',
    title: 'content ships',
    blurb: 'Ready-to-post UGC, delivered fast and on-brand.',
  },
];

/* ── TRACTION — REAL numbers only; renders only when non-empty.
   Example: { value: '12', label: 'creators onboarded' } */
const TRACTION: { value: string; label: string }[] = [];

/* Product peek screenshot — appears automatically once the file exists. */
const PRODUCT_PEEK = '/assets/dropdeck/canvas-peek.png';

type Partner = {
  name: string;
  tagline: string;
  logo: string;
  href?: string;
};

const PARTNERS: Partner[] = [
  {
    name: 'Poncho',
    tagline: 'AI client',
    logo: '/assets/partners/Poncho_Logo_Black.svg',
  },
];

/** Partner logo with a graceful fallback: if the image file hasn't been
 *  dropped into public/assets/partners/ yet, show the initial letter. */
function PartnerLogo({ name, logo }: { name: string; logo: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className="relative w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
      style={{
        // Stays light in BOTH themes — partner logos are often black
        // (Poncho's is), so the chip needs a bright backing in dark mode.
        background: 'rgba(253,249,242,0.92)',
        border: '1px solid rgba(var(--ink-rgb),0.12)',
      }}
    >
      {failed ? (
        <span
          aria-hidden
          className="font-display italic text-2xl"
          style={{ color: 'var(--ink-strong)' }}
        >
          {name[0]}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={`${name} logo`}
          className="w-full h-full object-contain p-1.5"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

/* Section divider — mono label + dashed rule */
function SectionRule({ label }: { label: string }) {
  return (
    <div
      className="flex items-center gap-3 mb-4 font-mono text-[11px] tracking-[0.26em] uppercase"
      style={{ color: 'rgba(var(--ink-rgb),0.55)' }}
    >
      <span>{label}</span>
      <span
        aria-hidden
        className="flex-1 border-t border-dashed"
        style={{ borderColor: 'rgba(var(--ink-rgb),0.2)' }}
      />
    </div>
  );
}

export default function DropdeckFolder() {
  const [peekFailed, setPeekFailed] = useState(false);

  return (
    <div className="relative w-full max-w-[920px] mx-auto">
      {/* Intro */}
      <p
        className="font-mono text-[11px] tracking-[0.3em] uppercase mb-3"
        style={{ color: 'rgba(var(--accent-rgb),0.85)' }}
      >
        ✦ currently building
      </p>
      <h3
        className="font-display italic leading-tight mb-3"
        style={{ color: 'var(--ink-strong)', fontSize: 'clamp(26px,3.6vw,40px)' }}
      >
        dropdeck.xyz
      </h3>
      {/* TODO(jacqueline): make this blurb yours — what dropdeck is in
          YOUR words, and what your role is (founder? building solo?). */}
      <p
        className="font-sans text-[15px] leading-relaxed mb-5 max-w-[560px]"
        style={{ color: 'rgba(var(--ink-rgb),0.78)' }}
      >
        A canvas-tech UGC agency — pairing brands with creators.
      </p>
      <a
        href="https://dropdeck.xyz"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block font-mono text-[12px] tracking-[0.22em] uppercase px-6 py-3 rounded-full mb-10 transition-transform hover:-translate-y-0.5"
        style={{
          background: 'linear-gradient(135deg, var(--ember-500) 0%, var(--rust-600) 100%)',
          color: 'var(--paper-bright)',
          boxShadow: '0 12px 24px -10px rgba(var(--accent-rgb),0.55)',
        }}
      >
        visit dropdeck.xyz ↗
      </a>

      {/* HOW IT WORKS — three steps, five seconds to understand */}
      <SectionRule label="how it works" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
        {STEPS.map((s, i) => (
          <div
            key={s.title}
            className="relative rounded-[12px] px-4 py-4"
            style={{
              background: 'rgba(var(--paper-rgb),0.7)',
              border: '1px solid rgba(var(--ink-rgb),0.16)',
            }}
          >
            <div className="flex items-baseline gap-2.5 mb-2">
              <span
                className="font-mono text-[11px] tracking-[0.2em]"
                style={{ color: 'rgba(var(--accent-rgb),0.9)' }}
              >
                0{i + 1}
              </span>
              <span aria-hidden className="text-[16px]" style={{ color: 'var(--ember-500)' }}>
                {s.glyph}
              </span>
              <span
                className="font-display italic text-[18px]"
                style={{ color: 'var(--ink-strong)' }}
              >
                {s.title}
              </span>
            </div>
            <p
              className="font-sans text-[13.5px] leading-relaxed"
              style={{ color: 'rgba(var(--ink-rgb),0.7)' }}
            >
              {s.blurb}
            </p>
            {/* connector arrow between steps (desktop only) */}
            {i < STEPS.length - 1 && (
              <span
                aria-hidden
                className="hidden sm:flex absolute top-1/2 -right-[14px] -translate-y-1/2 font-mono text-[13px] z-10"
                style={{ color: 'rgba(var(--accent-rgb),0.7)' }}
              >
                →
              </span>
            )}
          </div>
        ))}
      </div>

      {/* PRODUCT PEEK — browser-frame mockup; appears once the
          screenshot exists at public/assets/dropdeck/canvas-peek.png */}
      {!peekFailed && (
        <div className="mb-10">
          <SectionRule label="the canvas" />
          <div
            className="rounded-[12px] overflow-hidden mx-auto"
            style={{
              maxWidth: 640,
              background: 'rgba(var(--paper-rgb),0.8)',
              border: '1px solid rgba(var(--ink-rgb),0.16)',
              boxShadow: '0 16px 36px -22px rgba(0,0,0,0.4)',
            }}
          >
            <div
              className="flex items-center gap-2 px-3.5 py-2.5"
              style={{ borderBottom: '1px solid rgba(var(--ink-rgb),0.12)' }}
            >
              <span aria-hidden className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(var(--ink-rgb),0.2)' }} />
              <span aria-hidden className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(var(--ink-rgb),0.2)' }} />
              <span
                className="ml-1 flex-1 font-mono text-[10.5px] tracking-[0.14em] px-2.5 py-1 rounded-full truncate"
                style={{
                  background: 'rgba(var(--hi-rgb),0.35)',
                  color: 'rgba(var(--ink-rgb),0.55)',
                  border: '1px solid rgba(var(--ink-rgb),0.1)',
                }}
              >
                dropdeck.xyz/canvas
              </span>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PRODUCT_PEEK}
              alt="dropdeck canvas preview"
              className="w-full h-auto block"
              loading="lazy"
              onError={() => setPeekFailed(true)}
            />
          </div>
        </div>
      )}

      {/* TRACTION — real numbers only; hidden until TRACTION has entries */}
      {TRACTION.length > 0 && (
        <>
          <SectionRule label="traction" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            {TRACTION.map((t) => (
              <div
                key={t.label}
                className="rounded-[12px] px-3 py-4 text-center"
                style={{
                  background: 'rgba(var(--paper-rgb),0.7)',
                  border: '1px solid rgba(var(--ink-rgb),0.16)',
                }}
              >
                <p
                  className="font-display italic leading-none"
                  style={{ color: 'var(--ember-500)', fontSize: 'clamp(24px,3vw,34px)' }}
                >
                  {t.value}
                </p>
                <p
                  className="font-mono text-[10.5px] tracking-[0.22em] uppercase mt-2"
                  style={{ color: 'rgba(var(--ink-rgb),0.6)' }}
                >
                  {t.label}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* PARTNERS */}
      <SectionRule label="partnerships" />
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {PARTNERS.map((p) => {
          const card = (
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-[12px] px-4 py-6 h-full transition-transform hover:-translate-y-0.5"
              style={{
                background: 'rgba(var(--paper-rgb),0.75)',
                border: '1px solid rgba(var(--ink-rgb),0.16)',
                boxShadow: '0 8px 20px -14px rgba(0,0,0,0.3)',
              }}
            >
              <PartnerLogo name={p.name} logo={p.logo} />
              <div className="text-center">
                <p
                  className="font-display italic text-[18px] leading-tight"
                  style={{ color: 'var(--ink-strong)' }}
                >
                  {p.name}
                </p>
                <p
                  className="font-mono text-[9px] tracking-[0.22em] uppercase mt-1"
                  style={{ color: 'rgba(var(--ink-rgb),0.55)' }}
                >
                  {p.tagline}
                </p>
              </div>
            </div>
          );
          return (
            <li key={p.name} className="h-full">
              {p.href ? (
                <a href={p.href} target="_blank" rel="noopener noreferrer" className="block h-full">
                  {card}
                </a>
              ) : (
                card
              )}
            </li>
          );
        })}

        {/* "More soon" placeholder cell keeps the grid from feeling empty */}
        <li>
          <div
            className="flex items-center justify-center rounded-[12px] px-4 py-6 h-full font-mono text-[11px] tracking-[0.24em] uppercase"
            style={{
              border: '1px dashed rgba(var(--ink-rgb),0.25)',
              color: 'rgba(var(--ink-rgb),0.45)',
              minHeight: 140,
            }}
          >
            + more soon
          </div>
        </li>
      </ul>
    </div>
  );
}
