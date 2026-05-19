'use client';

import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  type MotionValue,
} from 'framer-motion';

/**
 * PageAscii — ASCII tokens that wander across the WHOLE second half of
 * the page (from below the hero through the folders and the footer).
 *
 * Lives at the page level (rendered as a sibling of <Hero> / <FolderTabs>
 * / <PageFooter>) so the drift never stops at section boundaries —
 * tokens travel through every section, side to side, top to bottom.
 *
 * Architecture:
 *   - One wrapper covers the area from `top: 100vh` (below the hero) to
 *     `bottom: 0`. position: absolute so it scrolls with the page.
 *   - Each token has a base anchor position (top + left as %) plus a long
 *     CSS keyframe traversal animation that walks it across the viewport
 *     width.
 *   - On top of that base motion, each token tracks the global cursor
 *     position and gets pushed away if the cursor gets close — same
 *     repel physics the hero ASCII uses.
 *
 * The cursor motion values are global to this file (single window listener)
 * and shared across all tokens so we don't attach 18 separate listeners.
 */

type Token = {
  art: string;
  size: number;
  /** Anchor position — % of the wrapper. Tokens are then animated
   *  relative to this anchor. */
  top: string;
  left: string;
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

/* A bunch of tokens spread across the WHOLE region below the hero.
   Vertical bands are spaced every ~7-10% so coverage is even from top
   (just below the hero) to bottom (under the footer). */
const TOKENS: Token[] = [
  // Top band — right under the hero
  { art: '❀',           size: 30, top: '2%',  left: '5%',  color: 'var(--rust-500)',  traverse: 'traverse-lr',       delay: -4 },
  { art: '✦',           size: 18, top: '4%',  left: '70%', color: 'var(--ember-500)', traverse: 'traverse-rl--slow', delay: -10 },
  { art: '⋆',           size: 16, top: '7%',  left: '40%', color: 'var(--rust-500)',  traverse: 'traverse-wander',   delay: -2 },

  // Upper-middle
  { art: 'ʕ•ᴥ•ʔ',       size: 18, top: '13%', left: '10%', color: 'var(--moss-500)',  traverse: 'traverse-lr--slow', delay: -8 },
  { art: '✧',           size: 20, top: '16%', left: '85%', color: 'var(--ember-400)', traverse: 'traverse-rl',       delay: -16 },
  { art: 'ฅ^•ﻌ•^ฅ',      size: 16, top: '20%', left: '50%', color: 'var(--rust-600)',  traverse: 'traverse-lr',       delay: -22 },

  // Middle — flows behind the folder body
  { art: '✿',           size: 26, top: '28%', left: '3%',  color: 'var(--rust-600)',  traverse: 'traverse-wander',   delay: -12 },
  { art: '(˘͈ᵕ˘͈❀)',     size: 14, top: '32%', left: '88%', color: 'var(--rust-600)',  traverse: 'traverse-rl--slow', delay: -28 },
  { art: '✦ ♡ ✦',       size: 14, top: '38%', left: '60%', color: 'var(--rust-500)',  traverse: 'traverse-lr--slow', delay: -6 },
  { art: '★彡',          size: 18, top: '42%', left: '20%', color: 'var(--ember-500)', traverse: 'traverse-rl',       delay: -3 },

  // Lower-middle
  { art: '¯\\_(ツ)_/¯',  size: 14, top: '52%', left: '8%',  color: 'var(--ink-900)',   traverse: 'traverse-lr',       delay: -18 },
  { art: '(っ◔◡◔)っ ♥',   size: 14, top: '58%', left: '78%', color: 'var(--rust-500)',  traverse: 'traverse-rl--slow', delay: -14 },
  { art: ':-)',          size: 16, top: '64%', left: '35%', color: 'var(--ember-500)', traverse: 'traverse-wander',   delay: -20 },

  // Bottom — coffee makes its cross-screen drift
  {
    art: ` ( (
  ) )
 ........
 |      |]
 \\      /
  \`----'`,
    size: 11, top: '72%', left: '15%', color: 'var(--ink-900)', traverse: 'traverse-lr--slow', delay: -30, lineHeight: 1,
  },
  // Laptop drifts right-to-left
  {
    art: `   ______
  |.--. |
  |'--'.|
  \`-----'`,
    size: 11, top: '80%', left: '70%', color: 'var(--ink-900)', traverse: 'traverse-rl--slow', delay: -8, lineHeight: 1,
  },
  // Bunny hops near the bottom
  {
    art: ` (\\(\\
 (•ᴥ•)
o_(")(")`,
    size: 12, top: '88%', left: '40%', color: 'var(--moss-500)', traverse: 'traverse-lr', delay: -24, lineHeight: 1.05,
  },
  // Final sparkles near the very bottom
  { art: '✦ ✧',          size: 14, top: '94%', left: '15%', color: 'var(--ember-500)', traverse: 'traverse-wander',   delay: -16 },
  { art: '♡',            size: 16, top: '96%', left: '80%', color: 'var(--rust-500)',  traverse: 'traverse-rl',       delay: -4 },
];

const REPEL_RADIUS = 180;
const REPEL_STRENGTH = 70;

export default function PageAscii() {
  // Shared global cursor position (one window listener for all tokens).
  const mouseX = useMotionValue(-9999);
  const mouseY = useMotionValue(-9999);

  useEffect(() => {
    // Only enable on hover-capable pointer devices
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!mq.matches) return;

    const onMove = (e: PointerEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    const onLeave = () => {
      mouseX.set(-9999);
      mouseY.set(-9999);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [mouseX, mouseY]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 overflow-hidden"
      // Cover the WHOLE region from just below the hero down to bottom.
      // Hero is roughly 100vh tall, so we start at 100vh.
      //
      // z-index 0 puts tokens BEHIND the folder body card (which sits
      // ~z-10) and the page footer. ASCII drift now sits at wallpaper
      // level — visible in the gutters around / between the cards but
      // hidden behind the cards themselves, no longer glowing on top
      // of the content.
      //
      // Start at 70vh (instead of 100vh) so the drift OVERLAPS the
      // bottom of the hero — tokens visibly flow from the hero through
      // the seam into the folder section, no dead band between them.
      style={{
        top: '70vh',
        bottom: 0,
        zIndex: 0,
      }}
    >
      {TOKENS.map((t, i) => (
        <RoamingToken key={i} token={t} mouseX={mouseX} mouseY={mouseY} />
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   RoamingToken — base CSS traversal + spring-physics cursor repel.

   Two-layer transforms:
     - Outer div: CSS keyframe traversal (writes transform)
     - Inner motion.div: framer-motion spring (writes its own transform)
   Both layers can coexist because the CSS animation lives on the outer,
   the spring lives on the inner.
   ────────────────────────────────────────────────────────────────────── */
function RoamingToken({
  token,
  mouseX,
  mouseY,
}: {
  token: Token;
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const dx = useMotionValue(0);
  const dy = useMotionValue(0);
  const springX = useSpring(dx, { stiffness: 140, damping: 16, mass: 0.6 });
  const springY = useSpring(dy, { stiffness: 140, damping: 16, mass: 0.6 });
  const [enabled, setEnabled] = useState(false);
  const isMultiline = token.art.includes('\n');

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setEnabled(mq.matches);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const compute = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const mx = mouseX.get();
      const my = mouseY.get();
      const ddx = cx - mx;
      const ddy = cy - my;
      const dist = Math.hypot(ddx, ddy);
      if (dist < REPEL_RADIUS && dist > 0.01) {
        const falloff = 1 - dist / REPEL_RADIUS;
        const k = (REPEL_STRENGTH * falloff * falloff) / dist;
        dx.set(ddx * k);
        dy.set(ddy * k);
      } else {
        dx.set(0);
        dy.set(0);
      }
    };
    const unsubX = mouseX.on('change', compute);
    const unsubY = mouseY.on('change', compute);
    return () => {
      unsubX();
      unsubY();
    };
  }, [enabled, dx, dy, mouseX, mouseY]);

  return (
    <div
      ref={ref}
      className={`absolute ${token.traverse}`}
      style={{
        top: token.top,
        left: token.left,
        animationDelay: `${token.delay}s`,
        willChange: 'transform, opacity',
      }}
    >
      <motion.div style={{ x: springX, y: springY }}>
        <pre
          style={{
            fontSize: token.size,
            color: token.color,
            opacity: isMultiline ? 0.42 : 0.55,
            textShadow: '0 0 10px rgba(255,255,255,0.45)',
            fontFamily: isMultiline
              ? 'var(--font-jetbrains), ui-monospace, monospace'
              : 'inherit',
            lineHeight: token.lineHeight ?? 1,
            margin: 0,
            whiteSpace: 'pre',
          }}
        >
          {token.art}
        </pre>
      </motion.div>
    </div>
  );
}
