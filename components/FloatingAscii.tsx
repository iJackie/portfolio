'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * A field of ASCII trinkets (tiny flowers, sparkles, bows) that:
 *  - gently drift in place via CSS keyframe animations
 *  - softly parallax toward the mouse cursor (spring-damped)
 *
 * Drop inside a relatively-positioned parent. Each trinket has its own
 * spring stiffness for variety so they don't move in lockstep.
 */

type Trinket = {
  glyph: string;
  /** percent positions inside the container */
  top: string;
  left: string;
  /** parallax magnitude in px */
  pull: number;
  /** drift animation variant */
  drift: 'drift-1' | 'drift-2' | 'drift-3';
  /** rotation in deg */
  rot?: number;
  /** size multiplier */
  size?: number;
  /** opacity 0..1 */
  opacity?: number;
};

const TRINKETS: Trinket[] = [
  { glyph: '✿',  top: '14%', left: '8%',  pull: 20, drift: 'drift-1', rot: -6,  size: 1.6, opacity: 0.45 },
  { glyph: '❀',  top: '22%', left: '92%', pull: 14, drift: 'drift-2', rot: 8,   size: 1.3, opacity: 0.4  },
  { glyph: '✺',  top: '70%', left: '6%',  pull: 18, drift: 'drift-3', rot: 0,   size: 1.4, opacity: 0.35 },
  { glyph: '⚘',  top: '78%', left: '88%', pull: 22, drift: 'drift-1', rot: -10, size: 1.5, opacity: 0.5  },
  { glyph: '✦',  top: '12%', left: '50%', pull: 10, drift: 'drift-2', rot: 0,   size: 1.0, opacity: 0.35 },
  { glyph: '⋆',  top: '58%', left: '46%', pull: 8,  drift: 'drift-3', rot: 0,   size: 1.0, opacity: 0.35 },
  { glyph: '✧',  top: '40%', left: '14%', pull: 12, drift: 'drift-1', rot: 0,   size: 0.9, opacity: 0.35 },
  { glyph: '❁',  top: '52%', left: '82%', pull: 16, drift: 'drift-2', rot: 4,   size: 1.2, opacity: 0.4  },
  { glyph: '꙳',  top: '32%', left: '30%', pull: 6,  drift: 'drift-3', rot: 0,   size: 1.0, opacity: 0.35 },
  { glyph: '⁕',  top: '86%', left: '40%', pull: 8,  drift: 'drift-1', rot: 0,   size: 0.9, opacity: 0.3  },
  { glyph: '✼',  top: '8%',  left: '72%', pull: 14, drift: 'drift-2', rot: -4,  size: 1.3, opacity: 0.4  },
  { glyph: '❋',  top: '64%', left: '66%', pull: 12, drift: 'drift-3', rot: 6,   size: 1.1, opacity: 0.4  },
];

export default function FloatingAscii() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  /** Mouse position normalized to [-1, 1] inside the container */
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let raf = 0;
    const handle = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
        const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
        mx.set(Math.max(-1, Math.min(1, nx)));
        my.set(Math.max(-1, Math.min(1, ny)));
      });
    };
    const reset = () => {
      mx.set(0);
      my.set(0);
    };
    window.addEventListener('pointermove', handle);
    el.addEventListener('pointerleave', reset);
    return () => {
      window.removeEventListener('pointermove', handle);
      el.removeEventListener('pointerleave', reset);
      cancelAnimationFrame(raf);
    };
  }, [mx, my]);

  return (
    <div ref={containerRef} aria-hidden className="absolute inset-0 pointer-events-none">
      {TRINKETS.map((t, i) => (
        <Trinket key={i} t={t} mx={mx} my={my} />
      ))}
    </div>
  );
}

function Trinket({
  t,
  mx,
  my,
}: {
  t: Trinket;
  mx: ReturnType<typeof useMotionValue<number>>;
  my: ReturnType<typeof useMotionValue<number>>;
}) {
  // Spring-damped parallax — each trinket has slightly different physics so they
  // don't all move at once.
  const stiff = 60 + Math.random() * 30;
  const damp = 18 + Math.random() * 6;
  const tx = useSpring(useTransform(mx, (v) => v * t.pull), { stiffness: stiff, damping: damp });
  const ty = useSpring(useTransform(my, (v) => v * t.pull), { stiffness: stiff, damping: damp });
  return (
    <motion.span
      style={{
        position: 'absolute',
        top: t.top,
        left: t.left,
        x: tx,
        y: ty,
        rotate: t.rot ?? 0,
        fontSize: `${(t.size ?? 1) * 22}px`,
        color: 'var(--rust-500)',
        opacity: t.opacity ?? 0.4,
        lineHeight: 1,
        textShadow: '0 1px 0 rgba(255,255,255,0.6)',
      }}
      className={t.drift}
    >
      {t.glyph}
    </motion.span>
  );
}
