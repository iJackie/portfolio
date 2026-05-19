'use client';

/**
 * FooterAscii — ASCII tokens drifting ACROSS the footer section.
 *
 * Uses the same cross-screen traversal animations as FolderAscii so the
 * tokens actually walk through the footer space rather than hugging the
 * gutters. Coffee + bunny + cat drift across, sparkles wander.
 *
 * Sits at z-0 behind the centered footer card. pointer-events: none.
 */

type Token = {
  art: string;
  size: number;
  top: string;
  color: string;
  traverse:
    | 'traverse-lr'
    | 'traverse-lr--slow'
    | 'traverse-rl'
    | 'traverse-rl--slow'
    | 'traverse-wander';
  delay: number;
  lineHeight?: number;
};

const TOKENS: Token[] = [
  // ── TOP BAND ──────────────────────────────────────────────────────
  { art: '❀',         size: 26, top: '6%',  color: 'var(--rust-500)',  traverse: 'traverse-lr',       delay: -6 },
  { art: '✦',         size: 18, top: '12%', color: 'var(--ember-500)', traverse: 'traverse-rl',       delay: -2 },
  { art: '✧',         size: 20, top: '14%', color: 'var(--ember-400)', traverse: 'traverse-wander',   delay: -10 },

  // ── MIDDLE BAND — flows across behind the centered card ───────────
  // Coffee cup making its cross-screen journey
  {
    art: ` ( (
  ) )
 ........
 |      |]
 \\      /
  \`----'`,
    size: 11, top: '32%', color: 'var(--ink-900)', traverse: 'traverse-lr--slow', delay: -14, lineHeight: 1,
  },
  { art: 'ʕ•ᴥ•ʔ',     size: 18, top: '46%', color: 'var(--moss-500)',  traverse: 'traverse-rl--slow', delay: -22 },
  { art: '(っ◔◡◔)っ ♥',  size: 14, top: '52%', color: 'var(--rust-500)',  traverse: 'traverse-lr',       delay: -8 },

  // ── BOTTOM BAND ───────────────────────────────────────────────────
  {
    art: ` (\\(\\
 (•ᴥ•)
o_(")(")`,
    size: 12, top: '68%', color: 'var(--moss-500)', traverse: 'traverse-rl', delay: -18, lineHeight: 1.05,
  },
  { art: 'ฅ^•ﻌ•^ฅ',    size: 16, top: '76%', color: 'var(--rust-600)',  traverse: 'traverse-lr--slow', delay: -28 },
  { art: '★彡',         size: 18, top: '82%', color: 'var(--ember-500)', traverse: 'traverse-wander',   delay: -4 },
  { art: '♡',          size: 16, top: '90%', color: 'var(--rust-500)',  traverse: 'traverse-rl',       delay: -16 },
  { art: '✦ ✧',        size: 14, top: '95%', color: 'var(--ember-500)', traverse: 'traverse-lr',       delay: -26 },
];

export default function FooterAscii() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {TOKENS.map((t, i) => {
        const isMultiline = t.art.includes('\n');
        return (
          <div
            key={i}
            className={`absolute ${t.traverse}`}
            style={{
              top: t.top,
              left: 0,
              animationDelay: `${t.delay}s`,
              willChange: 'transform, opacity',
            }}
          >
            <pre
              style={{
                fontSize: t.size,
                color: t.color,
                opacity: isMultiline ? 0.42 : 0.55,
                textShadow: '0 0 10px rgba(255,255,255,0.45)',
                fontFamily: isMultiline
                  ? 'var(--font-jetbrains), ui-monospace, monospace'
                  : 'inherit',
                lineHeight: t.lineHeight ?? 1,
                margin: 0,
                whiteSpace: 'pre',
              }}
            >
              {t.art}
            </pre>
          </div>
        );
      })}
    </div>
  );
}
