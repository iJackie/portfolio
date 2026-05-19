'use client';

import { TOTALS } from '@/data/events';

/**
 * Compact analytics strip — designed to sit above the globe headline.
 * 4-5 stat tokens separated by ASCII glyphs, on one line, mono+italic mix.
 *
 * Why not the old StatsStrip marquee?
 *   The marquee competed with the globe for attention and felt noisy.
 *   This static row reads as a quiet "by the numbers" caption, which lets
 *   the globe do the actual storytelling underneath.
 */
export default function AnalyticsRow() {
  return (
    <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-2 text-rust-700">
      <Stat value={`${TOTALS.events}+`} label="events" />
      <Sep>❀</Sep>
      <Stat value={`${TOTALS.cities}`} label="cities" />
      <Sep>✦</Sep>
      <Stat value={`${TOTALS.continents}`} label="continents" />
      <Sep>✧</Sep>
      <Stat value={`${TOTALS.attendees.toLocaleString()}+`} label="attendees" />
      <Sep>⋆</Sep>
      <Stat value={`${TOTALS.partners}+`} label="partners" />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-display-italic text-[26px] md:text-[34px] leading-none text-rust-700">
        {value}
      </span>
      <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.16em] text-rust-700/70">
        {label}
      </span>
    </span>
  );
}

function Sep({ children }: { children: React.ReactNode }) {
  return <span className="text-rust-400/70 text-[16px] md:text-[18px]">{children}</span>;
}
