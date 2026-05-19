'use client';

/**
 * FolderAscii — ASCII tokens drifting THROUGH the folder section.
 *
 * Unlike the hero scatter (which stays anchored in its gutters), these
 * tokens use long cross-screen traversal animations so they actually walk
 * across the section. A coffee cup can start off-screen left, drift
 * across UNDER the folder, and exit off-screen right.
 *
 * Each token gets:
 *   - a vertical start position (top: X%)
 *   - a traversal animation (left-to-right, right-to-left, or wander)
 *   - a slight delay so they're not all in sync
 *
 * Sits at z-0 behind the folder body card. pointer-events: none.
 */

type Token = {
  art: string;
  size: number;
  /** Vertical position in the section (% from top). */
  top: string;
  color: string;
  /** Which traversal animation class to use. */
  traverse:
    | 'traverse-lr'
    | 'traverse-lr--slow'
    | 'traverse-rl'
    | 'traverse-rl--slow'
    | 'traverse-wander';
  /** Negative delays start the animation mid-flight so the page doesn't
      open with a long blank wait before tokens appear. */
  delay: number;
  lineHeight?: number;
};

const TOKENS: Token[] = [
  // ── TOP BAND (around the tabs) ────────────────────────────────────
  { art: '❀',          size: 28, top: '3%',  color: 'var(--rust-500)',  traverse: 'traverse-lr',       delay: -4 },
  { art: '✦',          size: 18, top: '6%',  color: 'var(--ember-500)', traverse: 'traverse-rl--slow', delay: -12 },
  { art: '⋆',          size: 16, top: '9%',  color: 'var(--rust-500)',  traverse: 'traverse-wander',   delay: -2 },

  // ── UPPER-MIDDLE BAND ─────────────────────────────────────────────
  { art: 'ʕ•ᴥ•ʔ',      size: 18, top: '18%', color: 'var(--moss-500)',  traverse: 'traverse-lr--slow', delay: -8 },
  { art: '✧',          size: 20, top: '22%', color: 'var(--ember-400)', traverse: 'traverse-rl',       delay: -16 },
  { art: 'ฅ^•ﻌ•^ฅ',     size: 16, top: '28%', color: 'var(--rust-600)',  traverse: 'traverse-lr',       delay: -22 },

  // ── MIDDLE BAND — flows behind the folder body ────────────────────
  { art: '✿',          size: 26, top: '38%', color: 'var(--rust-600)',  traverse: 'traverse-wander',   delay: -10 },
  { art: '(˘͈ᵕ˘͈❀)',    size: 14, top: '42%', color: 'var(--rust-600)',  traverse: 'traverse-rl--slow', delay: -28 },
  { art: '✦ ♡ ✦',      size: 14, top: '50%', color: 'var(--rust-500)',  traverse: 'traverse-lr--slow', delay: -6 },
  { art: '★彡',         size: 18, top: '54%', color: 'var(--ember-500)', traverse: 'traverse-rl',       delay: -3 },

  // ── LOWER-MIDDLE BAND ─────────────────────────────────────────────
  { art: '¯\\_(ツ)_/¯', size: 14, top: '62%', color: 'var(--ink-900)',   traverse: 'traverse-lr',       delay: -18 },
  { art: '(っ◔◡◔)っ ♥',   size: 14, top: '70%', color: 'var(--rust-500)',  traverse: 'traverse-rl--slow', delay: -14 },
  { art: ':-)',         size: 16, top: '74%', color: 'var(--ember-500)', traverse: 'traverse-wander',   delay: -20 },

  // ── BOTTOM BAND — drifts UNDER the folder body ────────────────────
  // Coffee cup specifically does the cross-screen drift the user asked for
  {
    art: ` ( (
  ) )
 ........
 |      |]
 \\      /
  \`----'`,
    size: 11, top: '82%', color: 'var(--ink-900)', traverse: 'traverse-lr--slow', delay: -30, lineHeight: 1,
  },
  // Tiny laptop drifting in from the right
  {
    art: `   ______
  |.--. |
  |'--'.|
  \`-----'`,
    size: 11, top: '88%', color: 'var(--ink-900)', traverse: 'traverse-rl--slow', delay: -8, lineHeight: 1,
  },
  // Bunny hopping along the bottom edge
  {
    art: ` (\\(\\
 (•ᴥ•)
o_(")(")`,
    size: 12, top: '94%', color: 'var(--moss-500)', traverse: 'traverse-lr', delay: -24, lineHeight: 1.05,
  },
];

export default function FolderAscii() {
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
