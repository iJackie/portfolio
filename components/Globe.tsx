'use client';

/**
 * Globe — thin wrapper.
 *
 * The actual canvas + interaction live in <GlobeCanvas /> and are loaded
 * client-side only via next/dynamic. This guarantees there's no SSR /
 * hydration mismatch on the thousands of dots we render, and lets the
 * scene drive its own rAF loop without React fighting it.
 */

import dynamic from 'next/dynamic';
import type { EventItem } from '@/data/events';

type Props = { onSelect: (event: EventItem) => void };

const GlobeCanvas = dynamic(() => import('./GlobeCanvas'), {
  ssr: false,
  loading: () => <GlobePlaceholder />,
});

export default function GlobeScene(props: Props) {
  return <GlobeCanvas {...props} />;
}

/** Skeleton that matches the real scene's height so the page doesn't jump. */
function GlobePlaceholder() {
  return (
    <section id="globe" className="relative bg-cream-100">
      <div className="absolute inset-0 grainy-soft opacity-50" />
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-12 py-20 md:py-28">
        <h2 className="font-display-italic text-center text-rust-700 text-[44px] md:text-[68px] leading-[1.02] tracking-tight">
          built in cities <span className="text-sage-700">around the world.</span>
        </h2>
        <div className="mt-12 md:mt-16 grid md:grid-cols-2 gap-2">
          <div className="aspect-square bg-cream-200/40 rounded-full mx-auto w-full max-w-[720px]" />
          <div className="h-[480px] bg-transparent" />
        </div>
        <p className="mt-10 text-center text-[11px] uppercase tracking-[0.18em] text-warm-500/70">
          loading globe…
        </p>
      </div>
    </section>
  );
}
