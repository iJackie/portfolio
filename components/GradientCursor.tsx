'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Sparkle trail behind the NATIVE OS cursor.
 *
 *   - The OS cursor stays fully visible (we don't hide it). Arrow on
 *     plain text, finger on links/buttons — all normal.
 *   - As the pointer moves we drop a tiny ASCII glyph (✿ ❀ ✦ ⋆ etc.) at
 *     the cursor position. Each one fades + drifts + rotates and
 *     removes itself ~1.1s later → cute fade trail behind the cursor.
 *   - Throttled to ~55ms so the trail stays charming, not spammy.
 *   - Touch / coarse-pointer devices get nothing (no hover state).
 */

type Sparkle = {
  id: number;
  x: number;
  y: number;
  glyph: string;
  rot: number;
  size: number;
  drift: { x: number; y: number };
};

const TRAIL_GLYPHS = ['✿', '❀', '✦', '⋆', '✧', '❁', '✺', '✼', '꙳', '⁕', '❋', '⚘'];

export default function CursorTrail() {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [enabled, setEnabled] = useState(false);
  const lastEmitRef = useRef<number>(0);
  const idRef = useRef<number>(0);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setEnabled(mq.matches);
    const onChange = () => setEnabled(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastEmitRef.current < 55) return;
      lastEmitRef.current = now;

      const id = ++idRef.current;
      const glyph = TRAIL_GLYPHS[Math.floor(Math.random() * TRAIL_GLYPHS.length)];
      const rot = (Math.random() - 0.5) * 60;
      const size = 11 + Math.random() * 7;
      const drift = {
        x: (Math.random() - 0.5) * 22,
        y: -8 - Math.random() * 26,
      };

      setSparkles((s) => [...s, { id, x: e.clientX, y: e.clientY, glyph, rot, size, drift }]);
      window.setTimeout(() => {
        setSparkles((s) => s.filter((sp) => sp.id !== id));
      }, 1300);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div aria-hidden className="fixed inset-0 pointer-events-none z-[60]">
      <AnimatePresence>
        {sparkles.map((s) => (
          <motion.span
            key={s.id}
            initial={{ opacity: 0, scale: 0.6, x: s.x, y: s.y, rotate: s.rot }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.6, 1, 1, 0.85],
              x: s.x + s.drift.x,
              y: s.y + s.drift.y,
              rotate: s.rot + (s.drift.x > 0 ? 25 : -25),
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], times: [0, 0.15, 0.7, 1] }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              fontSize: s.size,
              color: 'var(--rust-500)',
              textShadow: '0 1px 2px rgba(255,255,255,0.6)',
              translateX: '-50%',
              translateY: '-50%',
              lineHeight: 1,
            }}
          >
            {s.glyph}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
