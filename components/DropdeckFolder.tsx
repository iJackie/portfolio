'use client';

import { useState } from 'react';

/**
 * DropdeckFolder — folder 05. What Jacqueline is currently building
 * (dropdeck.xyz, a canvas-tech UGC agency) + the partners she's
 * working with.
 *
 * To add a partner:
 *   1. Drop the logo into  public/assets/partners/<name>.png
 *   2. Add an entry to PARTNERS below (logo: '/assets/partners/<name>.png')
 */

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

export default function DropdeckFolder() {
  return (
    <div className="relative w-full max-w-[860px] mx-auto">
      {/* Intro */}
      <p
        className="font-mono text-[10px] tracking-[0.3em] uppercase mb-3"
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
      <p
        className="font-sans text-[14px] leading-relaxed mb-8 max-w-[560px]"
        style={{ color: 'rgba(var(--ink-rgb),0.78)' }}
      >
        A canvas-tech UGC agency — connecting brands with creators and
        turning campaigns into content that actually ships.{' '}
        <a
          href="https://dropdeck.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 transition-colors"
          style={{ color: 'var(--ember-500)' }}
        >
          dropdeck.xyz ↗
        </a>
      </p>

      {/* Partners */}
      <div
        className="flex items-center gap-3 mb-4 font-mono text-[10px] tracking-[0.26em] uppercase"
        style={{ color: 'rgba(var(--ink-rgb),0.55)' }}
      >
        <span>partnerships</span>
        <span aria-hidden className="flex-1 border-t border-dashed" style={{ borderColor: 'rgba(var(--ink-rgb),0.2)' }} />
      </div>

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
            className="flex items-center justify-center rounded-[12px] px-4 py-6 h-full font-mono text-[10px] tracking-[0.24em] uppercase"
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
