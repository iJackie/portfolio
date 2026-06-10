'use client';

/**
 * BuildLog — terminal-style "now" log (~/jacqueline/log). Lives at the
 * top of the RESUME folder: dated one-liners of what's shipping right
 * now, newest first, with a blinking cursor promising more.
 *
 * TODO(jacqueline): add a line whenever something ships — this is the
 * cheapest possible way to keep the resume feeling alive.
 */

const LOG: { date: string; line: string }[] = [
  { date: '2026-06', line: 'partnered with poncho — first AI client at dropdeck' },
  { date: '2026-05', line: 'building dropdeck.xyz — canvas-tech ugc agency' },
  { date: '2024-26', line: 'head of community @ infrared — 8→20+ team, $2.5B TVL, 20+ events' },
  { date: '2022-24', line: 'independent consulting era — gtm, comms, live event production' },
];

export default function BuildLog() {
  return (
    <div
      className="rounded-[12px] overflow-hidden mx-auto mb-12"
      style={{
        maxWidth: 640,
        background: '#1A0E16',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 16px 36px -20px rgba(0,0,0,0.6)',
      }}
    >
      <div
        className="flex items-center gap-2 px-3.5 py-2.5"
        style={{
          background: 'rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <span aria-hidden className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} />
        <span aria-hidden className="w-2.5 h-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
        <span aria-hidden className="w-2.5 h-2.5 rounded-full" style={{ background: '#28C840' }} />
        <span
          className="ml-2 font-mono text-[11px] tracking-[0.18em]"
          style={{ color: 'rgba(253,249,242,0.45)' }}
        >
          ~/jacqueline/log
        </span>
      </div>
      <div className="px-4 py-4 font-mono text-[13px] leading-[1.9]">
        {LOG.map((entry, i) => (
          <p key={i} className="whitespace-nowrap overflow-hidden text-ellipsis">
            <span style={{ color: 'rgba(255,90,160,0.85)' }}>{entry.date}</span>
            <span style={{ color: 'rgba(253,249,242,0.35)' }}> ▸ </span>
            <span style={{ color: 'rgba(253,249,242,0.85)' }}>{entry.line}</span>
          </p>
        ))}
        <p aria-hidden>
          <span style={{ color: 'rgba(253,249,242,0.45)' }}>$ </span>
          <span className="buildlog-cursor" style={{ color: 'var(--ember-400)' }}>▌</span>
        </p>
      </div>
      <style jsx>{`
        .buildlog-cursor { animation: buildlog-blink 1.1s steps(1) infinite; }
        @keyframes buildlog-blink { 50% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) {
          .buildlog-cursor { animation: none; }
        }
      `}</style>
    </div>
  );
}
