'use client';

import { TOTALS } from '@/data/events';

/**
 * A continuously-scrolling marquee strip of analytics + tags.
 *
 * Mechanics:
 *   - Render the same content twice in a flex row.
 *   - CSS animation translates that flex row by -50% over the loop period,
 *     so the second copy lands exactly where the first started → seamless.
 *   - On hover, animation-play-state pauses (so you can read a number).
 *
 * The single row defined in TOKENS is rich: big numbers + uppercase labels +
 * ASCII separators that match the rest of the site.
 */

type Token =
  | { kind: 'stat'; value: string; label: string }
  | { kind: 'tag'; text: string }
  | { kind: 'sep'; glyph: string };

const TOKENS: Token[] = [
  { kind: 'stat', value: `${TOTALS.events}+`,   label: 'events hosted' },
  { kind: 'sep',  glyph: '❀' },
  { kind: 'stat', value: `${TOTALS.cities}`,    label: 'cities' },
  { kind: 'sep',  glyph: '✦' },
  { kind: 'stat', value: `${TOTALS.continents}`,label: 'continents' },
  { kind: 'sep',  glyph: '✧' },
  { kind: 'stat', value: `${TOTALS.attendees.toLocaleString()}+`, label: 'attendees' },
  { kind: 'sep',  glyph: '❀' },
  { kind: 'stat', value: `${TOTALS.partners}+`, label: 'partners' },
  { kind: 'sep',  glyph: '⋆' },
  { kind: 'tag',  text: 'community' },
  { kind: 'sep',  glyph: '✦' },
  { kind: 'tag',  text: 'web3' },
  { kind: 'sep',  glyph: '✧' },
  { kind: 'tag',  text: 'growth' },
  { kind: 'sep',  glyph: '❀' },
  { kind: 'tag',  text: 'events that move markets' },
  { kind: 'sep',  glyph: '✦' },
  { kind: 'tag',  text: 'brooklyn → everywhere' },
  { kind: 'sep',  glyph: '⋆' },
];

export default function StatsStrip() {
  return (
    <section
      aria-label="Career highlights marquee"
      className="relative border-y border-rust-500/15 overflow-hidden"
      style={{
        background:
          'linear-gradient(90deg, #FBD9E3 0%, #FCE4EC 35%, #F8D1DF 70%, #F2B4C7 100%)',
      }}
    >
      {/* Soft edges so the marquee feels like it fades into the page */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 z-10"
        style={{ background: 'linear-gradient(90deg, rgba(252,228,236,0.95), transparent)' }}
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 z-10"
        style={{ background: 'linear-gradient(270deg, rgba(252,228,236,0.95), transparent)' }}
      />

      <div className="group relative py-5 md:py-7">
        <div
          className="marquee-track flex items-center gap-8 whitespace-nowrap"
          /* Pause on hover */
          style={{ animationPlayState: 'running' }}
        >
          {/* Render the row twice for a seamless loop */}
          {[0, 1].map((rep) => (
            <div key={rep} className="flex items-center gap-8 shrink-0">
              {TOKENS.map((tok, i) => (
                <TokenView key={`${rep}-${i}`} tok={tok} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee 40s linear infinite;
          width: max-content;
        }
        .group:hover .marquee-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none; }
        }
      `}</style>
    </section>
  );
}

function TokenView({ tok }: { tok: Token }) {
  if (tok.kind === 'stat') {
    return (
      <span className="inline-flex items-baseline gap-2">
        <span className="font-display-italic text-rust-700 text-[34px] md:text-[44px] leading-none">
          {tok.value}
        </span>
        <span className="text-[11px] uppercase tracking-[0.16em] text-rust-700/75">
          {tok.label}
        </span>
      </span>
    );
  }
  if (tok.kind === 'tag') {
    return (
      <span className="font-display-italic text-[22px] md:text-[28px] text-sage-700 leading-none">
        {tok.text}
      </span>
    );
  }
  // separator
  return (
    <span className="text-rust-500/70 text-[16px] md:text-[18px]">{tok.glyph}</span>
  );
}
