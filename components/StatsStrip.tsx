'use client';

import { motion } from 'framer-motion';

/**
 * StatsStrip — the four numbers that sell the story, big and unmissable.
 * Sits right under the hero bio so a recruiter hits proof before they
 * ever scroll. Theme-aware (CSS vars).
 */

const STATS = [
  { value: '$2.5B', label: 'TVL scaled' },
  { value: '8→20+', label: 'team growth' },
  { value: '20+', label: 'events produced' },
  { value: '10+', label: 'cities worldwide' },
];

export default function StatsStrip() {
  return (
    <div className="relative z-10 w-full max-w-[760px] mx-auto mt-7 px-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-[12px] px-3 py-4 text-center"
            style={{
              background: 'rgba(var(--paper-rgb),0.7)',
              border: '1px solid rgba(var(--ink-rgb),0.16)',
              boxShadow: '0 8px 22px -16px rgba(0,0,0,0.35)',
            }}
          >
            <p
              className="font-display italic leading-none"
              style={{ color: 'var(--ember-500)', fontSize: 'clamp(26px,3.4vw,38px)' }}
            >
              {s.value}
            </p>
            <p
              className="font-mono text-[9.5px] tracking-[0.22em] uppercase mt-2"
              style={{ color: 'rgba(var(--ink-rgb),0.6)' }}
            >
              {s.label}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
