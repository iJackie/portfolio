'use client';

/**
 * PageGarden — the wallpaper of the entire site.
 *
 * A single fixed-position SVG that paints a continuous garden across the
 * whole page: dark-plum band at the top, blooming rose mid-page, cream
 * warmth around the events, plum band at the bottom. ASCII botanical
 * vines snake down both margins.
 *
 * Sections sit on top of this wallpaper with TRANSPARENT or very-low-opacity
 * backgrounds, so the garden bleeds through. Section dividers disappear and
 * the whole page reads as one organism.
 *
 * Why fixed instead of in-flow?
 *   - Stays put while the user scrolls — feels like a single canvas.
 *   - No flash on section boundaries.
 *   - Performance is excellent (one SVG paint, no per-section layers).
 */

import { useEffect, useState } from 'react';

export default function PageGarden() {
  // We need to know the page height to size the gradient correctly.
  const [pageH, setPageH] = useState(0);

  useEffect(() => {
    const update = () => setPageH(Math.max(document.body.scrollHeight, window.innerHeight));
    update();
    const r = new ResizeObserver(update);
    r.observe(document.body);
    window.addEventListener('resize', update);
    return () => {
      r.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-50 overflow-hidden pointer-events-none"
      style={{ background: '#FBF6F1' }}
    >
      {/* Master gradient — runs the full page height, plum→rose→cream→rose→plum */}
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height: pageH || '100vh',
          background:
            // Top dark plum (hero band)
            'linear-gradient(to bottom, ' +
              '#2D1622 0vh, ' +              // ink
              '#3F1F2D 40vh, ' +             // ink-800
              '#A6406A 60vh, ' +             // rust-700
              '#EC93AE 80vh, ' +             // rust-400
              '#FCE4EC 110vh, ' +            // rust-100
              '#FBF6F1 150vh, ' +            // cream-100
              '#FBF6F1 220vh, ' +
              '#F2B4C7 290vh, ' +            // rust-200
              '#FBF6F1 370vh, ' +
              '#FBF6F1 480vh, ' +
              '#EC93AE 540vh, ' +
              '#3F1F2D 600vh, ' +
              '#2D1622 100% )',
        }}
      />

      {/* Bloom blobs scattered across the gradient — adds rhythm */}
      <BloomBlob top="22vh"  left="-12%" size={520} color="rgba(232,121,160,0.45)" />
      <BloomBlob top="55vh"  left="78%"  size={640} color="rgba(155,189,168,0.35)" />
      <BloomBlob top="135vh" left="-20%" size={780} color="rgba(232,121,160,0.32)" />
      <BloomBlob top="220vh" left="60%"  size={560} color="rgba(242,180,199,0.55)" />
      <BloomBlob top="310vh" left="-8%"  size={720} color="rgba(166,64,106,0.30)" />
      <BloomBlob top="420vh" left="70%"  size={680} color="rgba(232,121,160,0.40)" />
      <BloomBlob top="520vh" left="0%"   size={820} color="rgba(45,22,34,0.35)" />

      {/* Grain noise overlay — gives the whole page texture */}
      <div
        className="absolute inset-0 mix-blend-multiply opacity-[0.22]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence baseFrequency='0.85' numOctaves='2' seed='5'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.45 0'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Botanical vines snaking down the left + right margins */}
      <BotanicalVine side="left" pageH={pageH} />
      <BotanicalVine side="right" pageH={pageH} />
    </div>
  );
}

function BloomBlob({
  top, left, size, color,
}: { top: string; left: string; size: number; color: string }) {
  return (
    <div
      className="absolute rounded-full blur-3xl"
      style={{
        top, left,
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      }}
    />
  );
}

/**
 * A vertical ASCII vine drawn down one side of the page. Each "stem segment"
 * is a small pre tag of ASCII art, anchored at progressive top offsets so
 * the user scrolls past a continuous botanical illustration.
 *
 * The flowers / branches alternate so the vine feels hand-drawn.
 */
function BotanicalVine({ side, pageH }: { side: 'left' | 'right'; pageH: number }) {
  if (pageH === 0) return null;

  // One bloom every ~520px. Cap at a sensible number.
  const count = Math.min(Math.floor(pageH / 520), 14);
  const offsetSide = side === 'left'
    ? 'left-2 md:left-5'
    : 'right-2 md:right-5';

  return (
    <div className={`absolute top-0 ${offsetSide} h-full`}>
      {Array.from({ length: count }).map((_, i) => {
        const variant = VINE_SEGMENTS[i % VINE_SEGMENTS.length];
        return (
          <div
            key={i}
            className="absolute font-mono text-[10px] md:text-[11px] leading-[1.05] text-rust-300/40 select-none"
            style={{ top: `${i * 520 + 120}px`, transform: side === 'right' ? 'scaleX(-1)' : undefined }}
          >
            <pre>{variant}</pre>
          </div>
        );
      })}
    </div>
  );
}

/** A library of ASCII vine "blooms" — each one is a small piece of botanical
 *  art. They alternate down the margin to feel hand-drawn. */
const VINE_SEGMENTS = [
  `
   |
   |
  \\|/
   ❀
   |
  ,|.
   |
   |`,

  `
   |
   |
   ✿
  /|\\
 ' | '
   |
   |
   |`,

  `
   |
  \\|/
   ❁
   |
   |
   ✦
   |
   |`,

  `
    |
    |
   ,|,
    ❀
    |
   .|.
    |
    |`,

  `
   |
   |
  __|__
   |
   ✺
  /|\\
   |
   |`,

  `
   |
   ✦
   |
  \\|/
   ❀
   |
  '|'
   |`,
];
