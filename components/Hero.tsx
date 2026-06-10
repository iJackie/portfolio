'use client';

import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  type MotionValue,
} from 'framer-motion';
import StatsStrip from '@/components/StatsStrip';

/**
 * Hero — "Portfolio Lanyard" v6 — Borcelle-faithful, badge above wordmark
 *
 * Key fixes from v5:
 *   - Real Borcelle-style clip hardware (J-hook + barrel pivot + alligator
 *     jaw) rendered with layered SVG/CSS
 *   - Badge z-index sits ABOVE the JACQUELINE wordmark so info rows aren't
 *     obscured
 *   - Field row values become pills (Jacqueline Mach / Brooklyn, NY /
 *     growth · community · events)
 *   - Single centered bio paragraph instead of two columns
 *   - Headline: FIELD NOTES.
 *   - CONTACT ME (mailto) top-left
 *   - Photo crop fixed (center 8%)
 */

/* ASCII tokens — little drawings of things Jacqueline loves, drifting in
   the gutters around the badge. Mix of multi-line ASCII art (horse, robot,
   laptop, camera, plane) and single glyphs (flowers, sparkles, Bitcoin,
   music). Placed deliberately in the LEFT (<18%) and RIGHT (>82%) gutters
   so they don't fight the badge/wordmark in the center. */
type AsciiToken = {
  art: string;
  size: number;          // base font-size in px
  top: string;
  left?: string;
  right?: string;
  color: string;
  // Long roaming paths (each one is a multi-stop journey across the
  // hero, 38-52s long). Tokens that share a keyframe still feel unique
  // because durations differ and starting positions differ.
  drift: 'roam-1' | 'roam-2' | 'roam-3' | 'roam-4' | 'roam-5';
  lineHeight?: number;   // multi-line art needs tighter line-height
};

const ASCII_SCATTER: AsciiToken[] = [
  // ── LEFT FAR-GUTTER (outermost, edges) ───────────────────────────
  // Big bloom flower top-left
  {
    art: '❀',
    size: 44,
    top: '14%',
    left: '6%',
    color: 'var(--rust-500)',
    drift: 'roam-1',
  },
  // Little bunny — clear, cute, recognizable at small size
  {
    art: ` (\\(\\
 (•ᴥ•)
o_(")(")`,
    size: 14,
    top: '24%',
    left: '4%',
    color: 'var(--moss-500)',
    drift: 'roam-2',
    lineHeight: 1.05,
  },
  // Table flipper — the classic (╯°□°)╯ ┻━┻ emote
  {
    art: '(╯°□°)╯ ┻━┻',
    size: 18,
    top: '44%',
    left: '4%',
    color: 'var(--ember-500)',
    drift: 'roam-5',
  },
  // Tiny laptop
  {
    art: `   ______
  |.--. |
  |'--'.|
  \`-----'`,
    size: 12,
    top: '54%',
    left: '4%',
    color: 'var(--ink-900)',
    drift: 'roam-1',
    lineHeight: 1,
  },
  // Shrug emoticon — playful, fits the energy, pushed off the wall
  {
    art: '¯\\_(ツ)_/¯',
    size: 17,
    top: '62%',
    left: '10%',
    color: 'var(--ink-900)',
    drift: 'roam-4',
  },
  // Daisy bottom-left, slightly off-wall
  {
    art: '✿',
    size: 34,
    top: '82%',
    left: '8%',
    color: 'var(--rust-600)',
    drift: 'roam-5',
  },
  // Little bear ʕ•ᴥ•ʔ — Berachain energy, floats near wordmark
  {
    art: 'ʕ•ᴥ•ʔ',
    size: 22,
    top: '92%',
    left: '20%',
    color: 'var(--moss-500)',
    drift: 'roam-2',
  },

  // ── LEFT INNER-ORBIT (closer to badge — float in the negative space) ─
  // Sparkle hugging the badge top-left
  {
    art: '✦',
    size: 20,
    top: '20%',
    left: '28%',
    color: 'var(--ember-500)',
    drift: 'roam-3',
  },
  // Soft smile with flower — peeks in beside the badge
  {
    art: '(˘͈ᵕ˘͈❀)',
    size: 16,
    top: '42%',
    left: '17%',
    color: 'var(--rust-600)',
    drift: 'roam-4',
  },
  // Tiny shooting star streaking near the badge
  {
    art: '★彡',
    size: 20,
    top: '60%',
    left: '30%',
    color: 'var(--ember-500)',
    drift: 'roam-1',
  },
  // Small heart cluster — floats near the bottom of JACQUELINE
  {
    art: '✧ ♡ ✧',
    size: 16,
    top: '88%',
    left: '34%',
    color: 'var(--rust-500)',
    drift: 'roam-3',
  },
  // Sparkle right next to the badge (left side, mid-height)
  {
    art: '⋆',
    size: 16,
    top: '32%',
    left: '36%',
    color: 'var(--rust-500)',
    drift: 'roam-5',
  },
  // Heart hugging the badge from the left
  {
    art: '♡',
    size: 18,
    top: '50%',
    left: '38%',
    color: 'var(--ember-500)',
    drift: 'roam-1',
  },

  // ── RIGHT FAR-GUTTER (outermost, edges) ──────────────────────────
  // Sparkle top-right
  {
    art: '✧',
    size: 22,
    top: '18%',
    right: '8%',
    color: 'var(--ember-400)',
    drift: 'roam-5',
  },
  // Tiny robot for AI
  {
    art: ` [o_o]
 /|_|\\
  / \\`,
    size: 13,
    top: '28%',
    right: '4%',
    color: 'var(--moss-500)',
    drift: 'roam-3',
    lineHeight: 1,
  },
  // Cat face — Brooklyn cat-lady energy
  {
    art: 'ฅ^•ﻌ•^ฅ',
    size: 20,
    top: '44%',
    right: '5%',
    color: 'var(--rust-600)',
    drift: 'roam-1',
  },
  // Sending love — heart hug, pulled off the wall
  {
    art: '(っ◔◡◔)っ ♥',
    size: 16,
    top: '52%',
    right: '9%',
    color: 'var(--rust-500)',
    drift: 'roam-5',
  },
  // Tiny camera
  {
    art: `  _____
 |[O]  |
 |_____|`,
    size: 12,
    top: '66%',
    right: '6%',
    color: 'var(--rust-700)',
    drift: 'roam-2',
    lineHeight: 1,
  },
  // Coffee cup — small ASCII drawing
  {
    art: ` ( (
  ) )
 ........
 |      |]
 \\      /
  \`----'`,
    size: 11,
    top: '80%',
    right: '8%',
    color: 'var(--ink-900)',
    drift: 'roam-1',
    lineHeight: 1,
  },
  // Final sparkle, off the edge
  {
    art: '⋆',
    size: 20,
    top: '92%',
    right: '20%',
    color: 'var(--rust-500)',
    drift: 'roam-3',
  },

  // ── RIGHT INNER-ORBIT (closer to badge — float in the negative space) ─
  // Sparkle hugging the badge top-right
  {
    art: '✧',
    size: 20,
    top: '18%',
    right: '28%',
    color: 'var(--rust-500)',
    drift: 'roam-1',
  },
  // Classic smiley peeking in beside the badge
  {
    art: ':-)',
    size: 18,
    top: '42%',
    right: '17%',
    color: 'var(--ember-500)',
    drift: 'roam-3',
  },
  // Tiny flower near the badge bottom-right
  {
    art: '❀',
    size: 18,
    top: '62%',
    right: '30%',
    color: 'var(--rust-600)',
    drift: 'roam-5',
  },
  // Small sparkle pair floating near JACQUELINE
  {
    art: '✦ ✧',
    size: 18,
    top: '86%',
    right: '32%',
    color: 'var(--ember-500)',
    drift: 'roam-4',
  },
  // Sparkle right next to the badge (right side, mid-height)
  {
    art: '⋆',
    size: 16,
    top: '30%',
    right: '36%',
    color: 'var(--ember-500)',
    drift: 'roam-3',
  },
  // Heart hugging the badge from the right
  {
    art: '♡',
    size: 18,
    top: '52%',
    right: '38%',
    color: 'var(--rust-500)',
    drift: 'roam-5',
  },
];

export default function Hero() {
  const mouseX = useMotionValue(0);
  // Absolute viewport coordinates of the cursor — used by ASCII tokens
  // so they can compute their distance from the cursor and repel away.
  // Initialized off-screen so nothing repels until the mouse enters.
  const mouseClientX = useMotionValue(-9999);
  const mouseClientY = useMotionValue(-9999);

  const tilt = useSpring(useTransform(mouseX, [-1, 1], [-5, 5]), {
    stiffness: 55,
    damping: 14,
    mass: 1.2,
  });
  const sheenShift = useTransform(tilt, [-5, 5], ['62%', '38%']);
  const sheenBg = useMotionTemplate`radial-gradient(ellipse 35% 18% at ${sheenShift} 14%, rgba(255,255,255,0.55), transparent 70%), radial-gradient(ellipse 28% 14% at 72% 80%, rgba(255,255,255,0.22), transparent 70%)`;

  function onMove(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    mouseX.set(x * 2 - 1);
    mouseClientX.set(e.clientX);
    mouseClientY.set(e.clientY);
  }
  function onLeave() {
    mouseX.set(0);
    mouseClientX.set(-9999);
    mouseClientY.set(-9999);
  }

  return (
    <section
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      // Background gradient lives on <main className="ombre-page"> in
      // layout.tsx so it carries seamlessly into the folder section
      // below. The hero only adds the halftone dot texture on top.
      // No min-h-screen — the hero hugs its content height so the tabs
      // sit naturally beneath the bio instead of leaving a 30vh gap.
      className="halftone-dots relative overflow-hidden"
    >
      <div className="crosshair" aria-hidden />

      {/* TOP-LEFT — CONTACT ME (mailto) with pulsing dot */}
      <div className="absolute top-5 left-6 md:top-7 md:left-10 z-30 font-mono text-[10px] md:text-[11px] tracking-[0.18em] uppercase">
        <a
          href="mailto:jacquelinegiale@gmail.com"
          className="text-ink-900/80 hover:text-ember-500 transition-colors underline-offset-4 hover:underline flex items-center gap-2"
        >
          <span className="pulse-dot">✦</span>
          contact me
        </a>
      </div>

      {/* TOP-RIGHT — Socials */}
      <div className="absolute top-5 right-6 md:top-7 md:right-10 z-30 font-mono text-[10px] md:text-[11px] tracking-[0.18em] uppercase text-ink-900/80 text-right leading-[1.8]">
        <MetaLink href="https://t.me/ijackie_eth" label="tg" handle="@ijackie_eth" />
        <MetaLink href="https://twitter.com/berakana_" label="twitter" handle="@berakana_" />
        <MetaLink href="https://linkedin.com/in/jacquelinemach" label="linkedin" handle="/jacquelinemach" />
      </div>

      {/* ASCII scatter — each token tracks the cursor via shared motion
          values and runs away when the mouse gets close. */}
      {ASCII_SCATTER.map((s, i) => (
        <RepellingToken
          key={i}
          token={s}
          mouseClientX={mouseClientX}
          mouseClientY={mouseClientY}
        />
      ))}

      {/* LANYARD CLUSTER — strap + clip + badge flip together as ONE
          unit on click. Mouse-driven sway is applied to the badge only
          (so the strap+clip stay rigid during the natural hang). */}
      <LanyardCluster tilt={tilt} sheenBg={sheenBg} />

      {/* SPACER — reserves layout space so the wordmark/bio flow stays
          correct below. Height = strap + clip + badge. */}
      <div
        aria-hidden
        style={{
          // strap clamp(70,11dvh,130) + clip ≈ 52 + badge clamp(280,36dvh,400)
          // strap + clip + landscape badge height
          height: 'calc(clamp(70px, 11dvh, 130px) + 52px + clamp(220px, 32dvh, 340px))',
        }}
      />

      {/* CENTERED COLUMN — generous bottom padding so the bio gets real
          breathing room before the folder tabs begin. */}
      <div className="relative mx-auto flex flex-col items-center w-full max-w-[1100px] px-6 pb-16">

        {/* WORDMARK — sized via SVG viewBox so it ALWAYS fits the viewport
            width exactly. No clipping at any browser size. */}
        <Wordmark />

        {/* BIO — single centered paragraph. Middle-ground spacing: not
            crammed against the wordmark, not floating in air. */}
        <div
          className="relative z-10 w-full max-w-[640px] mx-auto text-center px-2"
          style={{ marginTop: 'clamp(8px, 1.5vw, 20px)' }}
        >
          {/* THE ASK — what she does + what she's looking for, stated
              plainly before any vibes. Recruiters read this first. */}
          <p
            className="font-mono text-[10.5px] md:text-[11.5px] tracking-[0.26em] uppercase mb-3"
            style={{ color: 'var(--ember-500)' }}
          >
            ✦ growth · community · events lead — open to work ✦
          </p>
          <h3 className="font-sans font-bold uppercase text-ink-900 text-[12px] tracking-[0.2em] mb-3">
            Building memories.
          </h3>
          <p className="font-sans text-ink-900/80 text-[14px] md:text-[15px] leading-[1.6]">
            I build communities, curate events, and run the ops behind them.
            Most recently scaled a crypto protocol from 8 to 20+ employees
            and $2.5B in TVL, with 20+ events across 10+ cities. Equal parts
            marketer, EA, and project manager, with a real love for
            supporting founders and being the person they trust to hold the
            rest together. Currently building{' '}
            <a
              href="https://dropdeck.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ember-500 hover:underline underline-offset-4 font-medium"
            >
              dropdeck.xyz
            </a>
            , a canvas-tech UGC agency.
          </p>
          {/* GM! Let's chat. — short ember sign-off, doubles as a mailto. */}
          <p className="font-sans text-[14px] md:text-[15px] mt-3">
            <a
              href="mailto:jacquelinegiale@gmail.com"
              className="text-ember-500 hover:underline underline-offset-4 font-medium"
            >
              GM! Let&apos;s chat.
            </a>
          </p>
        </div>

        {/* THE PROOF — four big numbers, right where the eye lands next */}
        <StatsStrip />

        {/* Scroll cue — the folders live below the fold; make sure
            nobody bounces without knowing they exist. */}
        <div
          aria-hidden
          className="relative z-10 mt-8 font-mono text-[10px] tracking-[0.3em] uppercase scroll-cue"
          style={{ color: 'rgba(var(--ink-rgb),0.5)' }}
        >
          ↓ open the folders
        </div>
        <style jsx>{`
          .scroll-cue {
            animation: scroll-cue-bounce 2.2s ease-in-out infinite;
          }
          @keyframes scroll-cue-bounce {
            0%, 100% { transform: translateY(0); }
            50%      { transform: translateY(6px); }
          }
          @media (prefers-reduced-motion: reduce) {
            .scroll-cue { animation: none; }
          }
        `}</style>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   RepellingToken — renders a single ASCII art piece that runs away
   from the cursor with spring physics.

   How it works:
   - The parent <Hero> passes down motionValues for the cursor's
     viewport coordinates (mouseClientX/Y)
   - On every animation frame, we read the token's own center via
     getBoundingClientRect and compute the vector from cursor → token
   - If distance < REPEL_RADIUS, we push the token along that vector,
     strength scaling with proximity (closer = stronger push)
   - Offsets are wrapped in useSpring so motion feels weighty
   - The base position (top/left/right) is preserved via outer wrapper;
     the inner div applies the springy x/y offset on top of it
   - Touch-only devices skip the effect (pointerType check)
   ──────────────────────────────────────────────────────────────── */
const REPEL_RADIUS = 220;     // px — distance at which repel begins
const REPEL_STRENGTH = 80;    // px — max push at the closest point

function RepellingToken({
  token,
  mouseClientX,
  mouseClientY,
}: {
  token: AsciiToken;
  mouseClientX: MotionValue<number>;
  mouseClientY: MotionValue<number>;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const anchorRef = useRef<{ x: number; y: number } | null>(null);
  const dx = useMotionValue(0);
  const dy = useMotionValue(0);
  const springX = useSpring(dx, { stiffness: 140, damping: 16, mass: 0.6 });
  const springY = useSpring(dy, { stiffness: 140, damping: 16, mass: 0.6 });
  const isMultiline = token.art.includes('\n');

  useEffect(() => {
    // Skip on touch-only devices
    const mq = typeof window !== 'undefined'
      ? window.matchMedia('(hover: hover) and (pointer: fine)')
      : null;
    if (!mq || !mq.matches) return;

    // CAPTURE THE TOKEN'S ANCHOR POSITION ONCE.
    // We disable the parent's CSS animation briefly, take a snapshot of
    // where the token sits "at rest" in the viewport, then re-enable it.
    // This anchor is what we compute distance from — much simpler and
    // immune to any transform composition issues.
    const captureAnchor = () => {
      const el = ref.current;
      if (!el) return;
      const parent = el.parentElement;
      if (!parent) return;
      const prevAnimation = parent.style.animation;
      parent.style.animation = 'none';
      // Force reflow
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      parent.offsetHeight;
      const rect = el.getBoundingClientRect();
      anchorRef.current = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
      parent.style.animation = prevAnimation;
    };

    // Capture immediately and again on resize (window dims change anchor)
    captureAnchor();
    const onResize = () => captureAnchor();
    window.addEventListener('resize', onResize);

    // Subscribe to mouse motion-value changes directly. Each time the
    // cursor moves, recompute the repel offset.
    const computeRepel = () => {
      const a = anchorRef.current;
      if (!a) return;
      const mx = mouseClientX.get();
      const my = mouseClientY.get();
      const ddx = a.x - mx;
      const ddy = a.y - my;
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

    const unsubX = mouseClientX.on('change', computeRepel);
    const unsubY = mouseClientY.on('change', computeRepel);

    return () => {
      window.removeEventListener('resize', onResize);
      unsubX();
      unsubY();
    };
  }, [dx, dy, mouseClientX, mouseClientY]);

  // NESTED ANIMATIONS — critical for repel to work:
  // - OUTER div: holds the CSS `drift-N` animation (transform: translate + rotate)
  // - INNER motion.div: framer-motion writes its repel transform here
  // - If both lived on the same element, the CSS animation would overwrite
  //   framer-motion's transform every frame and the repel would never show.
  return (
    <div
      className={`absolute pointer-events-none select-none ${token.drift}`}
      style={{
        top: token.top,
        ...(token.left ? { left: token.left } : {}),
        ...(token.right ? { right: token.right } : {}),
        zIndex: 2,
      }}
      aria-hidden
    >
      <motion.div
        ref={ref}
        style={{
          x: springX,
          y: springY,
        }}
      >
        <pre
          style={{
            fontSize: token.size,
            color: token.color,
            opacity: isMultiline ? 0.55 : 0.7,
            textShadow: '0 0 12px rgba(var(--ascii-glow),0.45)',
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

/* ────────────────────────────────────────────────────────────────
   Wordmark — SVG with a viewBox that auto-scales the text to fill
   the parent's width. The text can NEVER overflow the viewport.

   How it works:
   - The SVG is set to width: 90vw (always fills 90% of the viewport)
   - The viewBox dimensions are matched to the natural rendered width
     of the text "JACQUELINE" in Inter Black at a reference size
   - SVG auto-scales its contents to fit, so the text grows or shrinks
     to match whatever 90vw is
   - The misregister "shadow" effect is replicated with three layered
     <text> elements (ember + rose + black ink)
   ──────────────────────────────────────────────────────────────── */
function Wordmark() {
  return (
    <div
      className="relative w-full flex justify-center pointer-events-none select-none z-10"
      style={{ marginTop: 'clamp(-110px, -9vw, -55px)' }}
    >
      {/*
        Sizing math:
          - "JACQUELINE" (10 chars) in Inter Tight Black at fontSize=220
            with letter-spacing=-10 renders ~1100 SVG units wide
          - viewBox width = 1300 gives ~100 units of horizontal padding
            so the letters never touch the SVG edges
          - SVG width = 94vw → text always fills 94% of viewport, no overflow
      */}
      <svg
        viewBox="0 0 1300 260"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '94vw',
          maxWidth: '1700px',
          height: 'auto',
          display: 'block',
        }}
        aria-label="Jacqueline"
      >
        {/* Ember offset (misregistration) */}
        <text
          x="650"
          y="210"
          textAnchor="middle"
          fontWeight="900"
          fontSize="220"
          letterSpacing="-10"
          fill="var(--ember-500)"
          opacity="0.55"
          transform="translate(3, 2)"
          style={{
            fontFamily: 'var(--font-inter-tight), system-ui, sans-serif',
            mixBlendMode: 'multiply',
          }}
        >
          JACQUELINE
        </text>
        {/* Rose offset (misregistration) */}
        <text
          x="650"
          y="210"
          textAnchor="middle"
          fontWeight="900"
          fontSize="220"
          letterSpacing="-10"
          fill="var(--rust-500)"
          opacity="0.35"
          transform="translate(-2, -1)"
          style={{
            fontFamily: 'var(--font-inter-tight), system-ui, sans-serif',
            mixBlendMode: 'multiply',
          }}
        >
          JACQUELINE
        </text>
        {/* Main ink */}
        <text
          x="650"
          y="210"
          textAnchor="middle"
          fontWeight="900"
          fontSize="220"
          letterSpacing="-10"
          fill="var(--ink-900)"
          style={{
            fontFamily: 'var(--font-inter-tight), system-ui, sans-serif',
          }}
        >
          JACQUELINE
        </text>
      </svg>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   The clip — RESTORED to the loop-bar + neck + jaw design.
     1. CHROME LOOP BAR at top: a horizontal chrome bar with a slot
        (the strap threads through it visibly)
     2. SHORT NECK connects bar → jaw
     3. JAW CLIP: wider chrome bar below that grips the badge
   ──────────────────────────────────────────────────────────────── */
function BorcelleClip() {
  return (
    <div
      className="relative z-30 flex flex-col items-center"
      style={{
        marginTop: '-8px',     /* strap threads visibly into the loop */
        marginBottom: '-12px', /* jaw visibly grips the badge */
      }}
      aria-hidden
    >
      <svg
        width="64"
        height="52"
        viewBox="0 0 64 52"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="clipChrome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#ffffff" />
            <stop offset="14%"  stopColor="#dad7d1" />
            <stop offset="40%"  stopColor="#8e8b86" />
            <stop offset="56%"  stopColor="#3e3c39" />
            <stop offset="76%"  stopColor="#7e7b76" />
            <stop offset="100%" stopColor="#c8c5bf" />
          </linearGradient>
          <filter id="clipDS" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.4" floodOpacity="0.42" />
          </filter>
        </defs>

        {/* 1. LOOP BAR — top chrome bar with a horizontal slot. */}
        <g filter="url(#clipDS)">
          <rect x="12" y="0" width="40" height="16" rx="3" fill="url(#clipChrome)" />
          {/* Strap slot cutout */}
          <rect x="18" y="3" width="28" height="5" rx="1.2" fill="#1a1612" />
          {/* Inner shadow on the top of the slot */}
          <rect x="18" y="3" width="28" height="1.4" fill="rgba(0,0,0,0.65)" />
          {/* Top highlight */}
          <path d="M 14 1.5 L 50 1.5" stroke="rgba(255,255,255,0.85)" strokeWidth="1" strokeLinecap="round" />
          {/* Bottom shadow band */}
          <rect x="12" y="13" width="40" height="2.5" rx="1" fill="rgba(0,0,0,0.18)" />
        </g>

        {/* 2. SHORT NECK — connects loop bar to the jaw */}
        <g filter="url(#clipDS)">
          <rect x="22" y="16" width="20" height="6" rx="1.5" fill="url(#clipChrome)" />
          <rect x="22" y="16" width="20" height="1" fill="rgba(255,255,255,0.75)" />
        </g>

        {/* 3. JAW CLIP — wider chrome bar that visibly grips the badge */}
        <g filter="url(#clipDS)">
          <rect x="6" y="22" width="52" height="22" rx="3.5" fill="url(#clipChrome)" />
          {/* Top highlight on the jaw */}
          <path d="M 9 23.5 L 55 23.5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" strokeLinecap="round" />
          {/* Lower lip shadow */}
          <rect x="6" y="38" width="52" height="4" fill="rgba(0,0,0,0.18)" />
          {/* Bottom edge highlight */}
          <path d="M 10 42.5 L 54 42.5" stroke="rgba(255,255,255,0.55)" strokeWidth="0.8" strokeLinecap="round" />
          {/* Center pin */}
          <circle cx="32" cy="32" r="1.6" fill="#2a2826" />
          <circle cx="32" cy="31.6" r="0.6" fill="#c8c5bf" />
        </g>
      </svg>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Top-corner meta link
   ──────────────────────────────────────────────────────────────── */
function MetaLink({
  href,
  label,
  handle,
}: {
  href: string;
  label: string;
  handle: string;
}) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <span className="text-ink-900/55">{label}:</span>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-ember-500 transition-colors underline-offset-4 hover:underline"
      >
        {handle}
      </a>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Badge — sized ~40% of viewport height, info rows as pills
   ──────────────────────────────────────────────────────────────── */
/* The badge — two faces stacked. Whatever's rotated parent shows the
   correct face thanks to backface-visibility. No internal flip state. */
function BadgePouch({ sheenBg }: { sheenBg: ReturnType<typeof useMotionTemplate> }) {
  return (
    <div
      className="relative"
      style={{
        // HORIZONTAL LANYARD — landscape orientation (wider than tall).
        // Bigger overall presence than the old 4:5 portrait. Width is
        // driven by aspect-ratio off the clamped height.
        height: 'clamp(220px, 32dvh, 340px)',
        aspectRatio: '8 / 5',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* ✦ FLIP ME hint — sits OUTSIDE the lanyard's top-left corner.
          Hidden on the back face (backfaceVisibility:hidden) so it
          doesn't appear mirrored when the badge flips. The text+arrow
          live in a 3D-preserving wrapper so the hidden rule applies. */}
      <div
        aria-hidden
        className="absolute pointer-events-none z-20"
        style={{
          top: -42,
          left: -76,
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className="hint-pulse"
          style={{
            transform: 'rotate(-22deg)',
            transformOrigin: 'bottom right',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <span
            className="font-mono uppercase"
            style={{
              fontSize: 13,
              letterSpacing: '0.22em',
              color: 'var(--ember-500)',
              textShadow: '0 1px 2px rgba(255,255,255,0.7)',
              whiteSpace: 'nowrap',
              fontWeight: 600,
            }}
          >
            flip me ⤵
          </span>
        </div>
      </div>
      <style jsx>{`
        :global(.hint-pulse) {
          animation: hintPulse 2.2s ease-in-out infinite;
        }
        @keyframes hintPulse {
          0%, 100% { opacity: 0.85; }
          50%      { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          :global(.hint-pulse) { animation: none; }
        }
      `}</style>

      {/* OPEN TO WORK pill — small, anchored to the lanyard's top-right
          corner. Hidden on the back face so it doesn't show mirrored on
          flip. */}
      <div
        className="absolute pointer-events-none z-30"
        style={{
          // Right-corner anchor — sits ON the lanyard's top-right edge.
          top: -12,
          right: -8,
          transformStyle: 'preserve-3d',
        }}
        aria-hidden
      >
        <div
          style={{
            transform: 'rotate(8deg)',
            transformOrigin: 'bottom right',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <span
            className="font-mono uppercase inline-flex items-center gap-1"
            style={{
              fontSize: 9,
              letterSpacing: '0.18em',
              fontWeight: 600,
              color: 'var(--ember-600)',
              background: 'rgba(var(--paper-rgb),0.96)',
              padding: '3px 8px',
              borderRadius: 999,
              border: '1px solid rgba(255,90,44,0.45)',
              boxShadow:
                '0 3px 10px -6px rgba(255,90,44,0.45), inset 0 1px 0 rgba(255,255,255,0.7)',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              className="pulse-dot"
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: 'var(--ember-500)',
                display: 'inline-block',
                boxShadow: '0 0 6px rgba(255,90,44,0.7)',
              }}
            />
            open to work
          </span>
        </div>
      </div>

      {/* FRONT */}
      <div
        className="absolute inset-0"
        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
      >
        <BadgeFront sheenBg={sheenBg} />
      </div>

      {/* BACK — pre-rotated 180° so when the parent flips, this lands face-up */}
      <div
        className="absolute inset-0"
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
        }}
      >
        <BadgeBack />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   LanyardCluster — the strap + clip + badge wrapped in one 3D flip.
   Click anywhere on the cluster to flip the whole thing. The mouse-
   sway from the parent still applies to the badge inside.
   ──────────────────────────────────────────────────────────────── */
function LanyardCluster({
  tilt,
  sheenBg,
}: {
  tilt: ReturnType<typeof useSpring>;
  sheenBg: ReturnType<typeof useMotionTemplate>;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onClick={() => setFlipped((f) => !f)}
      className="absolute left-1/2 -translate-x-1/2 top-0 z-20 cursor-pointer"
      style={{ perspective: '1600px' }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 55, damping: 14, mass: 1.2 }}
        style={{
          transformStyle: 'preserve-3d',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Strap */}
        <div
          className="lanyard-webbing"
          style={{
            width: '20px',
            height: 'clamp(70px, 11dvh, 130px)',
            borderRadius: '0 0 2px 2px',
            marginBottom: '-6px',
          }}
          aria-hidden
        />

        {/* Clip */}
        <BorcelleClip />

        {/* Badge — also gets the mouse-sway rotation. CRITICAL:
            `transformStyle: preserve-3d` must be passed through here,
            otherwise the parent's rotateY flattens at this wrapper and
            the BadgePouch back-face never shows (front face renders
            mirrored instead). */}
        <motion.div
          style={{
            rotate: tilt,
            transformOrigin: '50% 0%',
            transformStyle: 'preserve-3d',
          }}
        >
          <BadgePouch sheenBg={sheenBg} />
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   The BACK of the badge — "if found, return to" credential card.
   ──────────────────────────────────────────────────────────────── */
function BadgeBack() {
  return (
    <div className="relative w-full h-full">
      {/* Same plastic pouch wrapper as the front */}
      <div
        className="relative w-full h-full rounded-[14px] overflow-hidden"
        style={{
          background: `
            linear-gradient(135deg,
              rgba(255,255,255,0.5) 0%,
              rgba(255,255,255,0.18) 12%,
              rgba(255,255,255,0.05) 35%,
              rgba(255,255,255,0.02) 65%,
              rgba(255,255,255,0.15) 90%,
              rgba(255,255,255,0.4) 100%
            )
          `,
          border: '1.5px solid rgba(255,255,255,0.85)',
          boxShadow: `
            0 24px 56px -20px rgba(63,31,45,0.45),
            inset 0 1.5px 0 rgba(255,255,255,0.95),
            inset 0 -1.5px 0 rgba(0,0,0,0.06)
          `,
        }}
      >
        {/* Cardstock insert (back side) */}
        <div
          className="absolute inset-[3.5%] rounded-[6px] overflow-hidden"
          style={{
            background: '#fdf9f2',
            boxShadow:
              'inset 0 0 0 1px rgba(63,31,45,0.06), 0 1px 0 rgba(255,255,255,0.6)',
            containerType: 'size',
          }}
        >
          {/* Same paper grain */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'180\' height=\'180\'><filter id=\'g\'><feTurbulence baseFrequency=\'0.95\' numOctaves=\'2\' seed=\'4\'/><feColorMatrix values=\'0 0 0 0 0.25  0 0 0 0 0.18  0 0 0 0 0.18  0 0 0 0.16 0\'/></filter><rect width=\'180\' height=\'180\' filter=\'url(%23g)\'/></svg>")',
              opacity: 0.35,
              mixBlendMode: 'multiply',
            }}
          />

          {/* HORIZONTAL BACK — "RETURN TO JACQUELINE" on the left,
              reward + contact on the right. Mirrors the front's split. */}
          <div
            className="relative h-full flex"
            style={{ padding: '4cqh 5cqw', gap: '5cqw' }}
          >
            {/* LEFT — headline + "if found" tag */}
            <div className="flex-1 flex flex-col justify-center">
              <span
                className="font-mono tracking-[0.22em] uppercase text-ember-500"
                style={{ fontSize: '3.4cqh' }}
              >
                ✦ if found
              </span>
              <h3
                className="font-display-italic text-ink-900 leading-[0.9]"
                style={{
                  fontStyle: 'italic',
                  fontSize: '16cqh',
                  marginTop: '1.5cqh',
                }}
              >
                return to
                <br />
                Jacqueline.
              </h3>
            </div>

            {/* RIGHT — reward + phone block */}
            <div
              className="shrink-0 flex flex-col justify-center items-end text-right"
              style={{ minWidth: '38%' }}
            >
              <span
                className="font-mono tracking-[0.2em] uppercase text-ink-900/65"
                style={{ fontSize: '3cqh' }}
              >
                reward: a coffee
              </span>
              <span
                className="font-mono tracking-[0.2em] uppercase text-ink-900/55"
                style={{ fontSize: '3cqh', marginTop: '1cqh' }}
              >
                brooklyn, ny
              </span>

              <div
                style={{
                  width: '60%',
                  height: '1px',
                  background: 'rgba(63,31,45,0.3)',
                  marginTop: '3cqh',
                  marginBottom: '2.4cqh',
                }}
              />

              <span
                className="font-mono tracking-[0.2em] uppercase text-ink-900/65"
                style={{ fontSize: '3cqh' }}
              >
                phone
              </span>
              <span
                className="font-mono text-ink-900 select-none"
                style={{ fontSize: '4.6cqh', fontWeight: 500, letterSpacing: '0.04em', marginTop: '0.6cqh' }}
              >
                +1 (714) 878-7559
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   The FRONT face of the badge (was previously inline in BadgePouch)
   ──────────────────────────────────────────────────────────────── */
function BadgeFront({ sheenBg }: { sheenBg: ReturnType<typeof useMotionTemplate> }) {
  return (
    <div
      className="relative w-full h-full"
    >
      {/* Shadow */}
      <div
        aria-hidden
        className="absolute -inset-x-4 -bottom-6 h-10 rounded-full"
        style={{
          background:
            'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(63,31,45,0.32), transparent 70%)',
          filter: 'blur(12px)',
          zIndex: -1,
        }}
      />

      {/* Plastic pouch — glassy, transparent like real PVC laminate.
          Subtle white tint at the edges, very transparent in the middle,
          with strong corner highlights. */}
      <div
        className="relative w-full h-full rounded-[14px] overflow-hidden"
        style={{
          background: `
            linear-gradient(135deg,
              rgba(255,255,255,0.5) 0%,
              rgba(255,255,255,0.18) 12%,
              rgba(255,255,255,0.05) 35%,
              rgba(255,255,255,0.02) 65%,
              rgba(255,255,255,0.15) 90%,
              rgba(255,255,255,0.4) 100%
            )
          `,
          border: '1.5px solid rgba(255,255,255,0.85)',
          boxShadow: `
            0 24px 56px -20px rgba(63,31,45,0.45),
            inset 0 1.5px 0 rgba(255,255,255,0.95),
            inset 0 -1.5px 0 rgba(0,0,0,0.06),
            inset 1.5px 0 0 rgba(255,255,255,0.4),
            inset -1.5px 0 0 rgba(0,0,0,0.04)
          `,
        }}
      >
        <motion.div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: sheenBg, mixBlendMode: 'screen' }}
        />

        {/* Cardstock insert (container queries for proportional internal type) */}
        <div
          className="absolute inset-[3.5%] rounded-[6px] overflow-hidden"
          style={{
            background: '#fdf9f2',
            boxShadow:
              'inset 0 0 0 1px rgba(63,31,45,0.06), 0 1px 0 rgba(255,255,255,0.6)',
            containerType: 'size',
          }}
        >
          {/* Grain */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'180\' height=\'180\'><filter id=\'g\'><feTurbulence baseFrequency=\'0.95\' numOctaves=\'2\' seed=\'4\'/><feColorMatrix values=\'0 0 0 0 0.25  0 0 0 0 0.18  0 0 0 0 0.18  0 0 0 0.16 0\'/></filter><rect width=\'180\' height=\'180\' filter=\'url(%23g)\'/></svg>")',
              opacity: 0.35,
              mixBlendMode: 'multiply',
            }}
          />

          {/* PASS-CARD LAYOUT (ZNUZ-inspired):
              LEFT  — portrait headshot in a paper frame + tiny barcode
              RIGHT — "PASS CARD" headline, card number, hand-label
                      style field rows, and a script signature line. */}
          <div
            className="relative h-full flex items-stretch"
            style={{ padding: '4.5cqh 5cqw', gap: '5cqw' }}
          >
            {/* LEFT COLUMN — portrait + barcode underneath */}
            <div
              className="relative shrink-0 flex flex-col"
              style={{ width: '32cqw' }}
            >
              {/* Headshot — portrait crop, not full-body */}
              <div
                className="relative rounded-[3px] overflow-hidden"
                style={{
                  flex: 1,
                  border: '1px solid rgba(63,31,45,0.25)',
                  boxShadow:
                    '0 8px 16px -10px rgba(63,31,45,0.4), inset 0 0 0 2px #fdf9f2',
                  minHeight: 0,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/PFPpng.png"
                  alt="Jacqueline Mach"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'center 22%' }}
                />
              </div>

              {/* Tiny brand strip below the photo — "PORTFOLIO NEW URBAN JACQUELINE" */}
              <p
                className="font-mono uppercase text-center text-ink-900/65"
                style={{
                  fontSize: '1.9cqh',
                  letterSpacing: '0.22em',
                  marginTop: '1cqh',
                  background: 'rgba(63,31,45,0.06)',
                  padding: '0.6cqh 0',
                  borderRadius: '2px',
                }}
              >
                J · BROOKLYN · NEW YORK · 2026
              </p>

              {/* BARCODE — pure CSS bars + caption */}
              <Barcode value="HOST PASS J-2026" />
            </div>

            {/* RIGHT COLUMN — title block + fields + signature */}
            <div className="flex-1 min-w-0 flex flex-col justify-between"
              style={{ paddingTop: '0.4cqh', paddingBottom: '0.4cqh' }}
            >
              {/* BIG title row — "PASS CARD" + card number underneath */}
              <div>
                <h2
                  className="font-sans font-black uppercase text-ink-900 leading-[0.9] tracking-[-0.02em]"
                  style={{ fontSize: '16cqh' }}
                >
                  Host Pass.
                </h2>
                <p
                  className="font-mono tracking-[0.16em] uppercase text-ink-900/55 mt-1"
                  style={{ fontSize: '3cqh' }}
                >
                  Card no. J-26.NYC-2049
                </p>
              </div>

              {/* Hand-label style field rows — sized up bigger so the
                  whole panel is dense and readable across the badge. */}
              <div
                className="flex flex-col"
                style={{ gap: '2.2cqh', marginTop: '2.4cqh' }}
              >
                <PassFieldRow label="Name"    value="Jacqueline Mach" />
                <PassFieldRow label="Based"   value="Brooklyn, NY" />
                <PassFieldRow label="Open to" value="growth · marketing · EA · community · events" />
              </div>

              {/* Signature line (left) — the OPEN TO WORK stamp has been
                  promoted to a big rotated badge in the empty corner
                  (see below, outside this column). */}
              <div className="flex items-end" style={{ marginTop: '1.6cqh' }}>
                <span
                  className="font-display italic text-ink-900/85"
                  style={{
                    fontSize: '4cqh',
                    borderBottom: '1px solid rgba(63,31,45,0.45)',
                    paddingBottom: '0.4cqh',
                    paddingRight: '1cqw',
                  }}
                >
                  jacqueline mach.
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* Field row — JetBrains Mono throughout (label + value) so the whole row
   reads as one technical/credential system. Labels are uppercase + tracked;
   values are normal case but same font. */
function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <span
        className="font-mono tracking-[0.2em] uppercase text-ink-900/75 shrink-0"
        style={{ fontSize: '3.4cqh' }}
      >
        {label}
      </span>
      <span
        className="flex-1 border-b border-dotted border-ink-900/40 min-w-[6px]"
        style={{ transform: 'translateY(-3px)' }}
      />
      <span
        className="font-mono text-ink-900 truncate"
        style={{
          fontSize: '3.4cqh',
          lineHeight: 1.1,
          fontWeight: 500,
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   PassFieldRow — ZNUZ-pass-card style: "Label:" in sans-bold, value
   on the same line in italic display font, like a hand-stamped field.
   ──────────────────────────────────────────────────────────────── */
function PassFieldRow({ label, value }: { label: string; value: string }) {
  // All rows use the same font size for visual consistency. Long values
  // wrap to a second line instead of shrinking — keeps Name / Based /
  // Open to reading as one uniform set of labels.
  return (
    <div className="flex items-baseline gap-2 min-w-0">
      <span
        className="font-sans font-semibold text-ink-900 shrink-0"
        style={{ fontSize: '4.4cqh', lineHeight: 1 }}
      >
        {label}:
      </span>
      <span
        className="font-display italic text-ink-900/90"
        style={{
          fontSize: '4.6cqh',
          lineHeight: 1.1,
          whiteSpace: 'normal',
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Barcode — pure CSS vertical bars + caption underneath. No external
   barcode library; the bars are randomized off the seed string but
   stable per value (so it renders the same every paint).
   ──────────────────────────────────────────────────────────────── */
function Barcode({ value }: { value: string }) {
  // Deterministic pseudo-random widths from the seed string
  let seed = 0;
  for (let i = 0; i < value.length; i++) seed = (seed * 31 + value.charCodeAt(i)) | 0;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) | 0;
    return ((seed >>> 0) % 1000) / 1000;
  };
  const bars: { w: number }[] = Array.from({ length: 42 }, () => ({
    // Widths between 1 and 3 px, mixed with thin gaps
    w: 0.6 + rand() * 2.4,
  }));

  return (
    <div
      className="flex flex-col items-center"
      style={{ marginTop: '1cqh' }}
    >
      <div
        className="flex items-end"
        style={{
          height: '6cqh',
          gap: 1,
          padding: '0 0.4cqw',
        }}
        aria-hidden
      >
        {bars.map((b, i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              width: `${b.w}px`,
              height: '100%',
              background: '#3F1F2D',
            }}
          />
        ))}
      </div>
      <span
        className="font-mono uppercase text-ink-900/65"
        style={{
          fontSize: '1.9cqh',
          letterSpacing: '0.22em',
          marginTop: '0.6cqh',
        }}
      >
        {value}
      </span>
    </div>
  );
}
