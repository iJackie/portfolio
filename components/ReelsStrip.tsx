'use client';

/**
 * ReelsStrip — "event highlights"
 *
 * A horizontal-scrolling deck of 9:16 cards, one per event. Each card shows
 * the event's flyer (poster) and, if a matching reel video exists in
 * /data/reels.ts, autoplays it muted + looped in place.
 *
 * Clicking a card opens the full event modal (same modal as Featured Events
 * used to use), so people get the story, stats, photos, merch, and links.
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │                       event highlights                          │
 *   │                                                                 │
 *   │   ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ...→                            │
 *   │   │evt│ │evt│ │evt│ │evt│ │evt│  scroll horizontally            │
 *   │   └───┘ └───┘ └───┘ └───┘ └───┘                                 │
 *   └─────────────────────────────────────────────────────────────────┘
 */

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';

import { EVENTS, type EventItem } from '@/data/events';
import { REELS } from '@/data/reels';

type Props = {
  onSelect: (event: EventItem) => void;
};

/** Build a lookup of event-id → reel video path so we know which cards have
 *  a video on top of their poster. (Reels are matched by suffix or by city
 *  name so adding `video: '/assets/honey-hour-bangkok.mp4'` to any reel will
 *  auto-attach to the corresponding event.) */
function reelVideoForEvent(event: EventItem): string | undefined {
  const cityLower = event.city.toLowerCase();
  // Prefer exact match where the reel id references the same event id
  const exact = REELS.find((r) => r.id.endsWith(event.id) || event.id.includes(r.id));
  if (exact?.video) return exact.video;
  // Fall back: any reel referencing this city
  const byCity = REELS.find(
    (r) => r.video && (r.caption.toLowerCase().includes(cityLower) || r.title.toLowerCase().includes(cityLower)),
  );
  return byCity?.video;
}

export default function ReelsStrip({ onSelect }: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (dx: number) => {
    scrollerRef.current?.scrollBy({ left: dx, behavior: 'smooth' });
  };

  return (
    <section id="event-highlights" className="relative overflow-hidden">
      {/* Translucent cream wash so PageGarden bleeds through */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(251,246,241,0.55), transparent 75%),' +
            'radial-gradient(ellipse 45% 60% at 100% 0%, rgba(232,121,160,0.16), transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-12 py-16 md:py-20">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <span className="eyebrow">event highlights</span>
            <h2 className="font-display-italic text-rust-700 text-[40px] md:text-[56px] leading-[1.05] tracking-tight mt-3">
              every <span className="text-sage-700">moment,</span> in motion.
            </h2>
            <p className="mt-3 text-ink-900/70 max-w-[58ch] text-[14px]">
              Every event I&apos;ve produced, side by side. Scroll through the
              flyers. Tap any card for the full story, photos, and merch.
            </p>
          </div>

          {/* Arrow nav for the scroller */}
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="scroll left"
              onClick={() => scrollBy(-400)}
              className="w-9 h-9 rounded-full bg-white/85 border border-rust-500/15 text-rust-700 hover:bg-rust-100 transition-colors flex items-center justify-center shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="scroll right"
              onClick={() => scrollBy(400)}
              className="w-9 h-9 rounded-full bg-white/85 border border-rust-500/15 text-rust-700 hover:bg-rust-100 transition-colors flex items-center justify-center shadow-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Horizontal scroller — snap-aligned cards */}
        <div className="relative -mx-6 md:-mx-12 px-6 md:px-12">
          <div
            ref={scrollerRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4"
            style={{ scrollbarWidth: 'thin' }}
          >
            {EVENTS.map((event) => (
              <EventReelCard
                key={event.id}
                event={event}
                videoSrc={reelVideoForEvent(event)}
                onOpen={() => onSelect(event)}
              />
            ))}
          </div>

          {/* Soft fade edges hint horizontal scroll */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-cream-100/95 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-cream-100/95 to-transparent" />
        </div>

        <p className="mt-6 text-[10.5px] uppercase tracking-[0.18em] text-warm-500/70 text-center">
          add video reels in <code className="font-mono normal-case tracking-normal text-rust-700/80 bg-cream-200/60 px-1.5 py-0.5 rounded">data/reels.ts</code>{' '}
          · drop mp4s into <code className="font-mono normal-case tracking-normal text-rust-700/80 bg-cream-200/60 px-1.5 py-0.5 rounded">public/assets/</code>
        </p>
      </div>
    </section>
  );
}

/* ───────── Single event card ───────── */

function EventReelCard({
  event,
  videoSrc,
  onOpen,
}: {
  event: EventItem;
  videoSrc: string | undefined;
  onOpen: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cardRef = useRef<HTMLButtonElement | null>(null);

  // Autoplay when the card is visible in the scroller; pause when off-screen
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) vid.play().catch(() => { /* user-gesture restriction OK */ });
        else vid.pause();
      },
      { threshold: 0.4 },
    );
    io.observe(vid);
    return () => io.disconnect();
  }, [videoSrc]);

  const poster = event.photos[0];
  const month = new Date(event.startDate).toLocaleString('en-US', { month: 'short' });
  const year = new Date(event.startDate).getFullYear();

  return (
    <motion.button
      ref={cardRef}
      type="button"
      onClick={onOpen}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="snap-start shrink-0 relative w-[200px] md:w-[240px] aspect-[9/16] rounded-2xl overflow-hidden border border-rust-500/15 bg-ink-900 shadow-[0_18px_42px_-22px_rgba(166,64,106,0.35)] group cursor-pointer text-left"
    >
      {videoSrc ? (
        <video
          ref={videoRef}
          src={videoSrc}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt={event.name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 60%, #E879A0 0%, #F2B4C7 40%, #FCE4EC 75%, #FFFFFF 100%)',
          }}
        />
      )}

      {/* Tiny "video" badge when this card has a reel */}
      {videoSrc && (
        <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-cream-100/85 backdrop-blur-sm rounded-full px-2 py-1 text-rust-700 text-[9px] uppercase tracking-[0.16em]">
          <span className="w-1 h-1 rounded-full bg-rust-500 animate-pulse" />
          reel
        </div>
      )}

      {/* Bottom caption — city · date · title */}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-ink-900/85 via-ink-900/35 to-transparent">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-rust-200/80">
          {event.city.toLowerCase()} · {month.toLowerCase()} {year}
        </p>
        <p className="font-display-italic text-cream-100 text-[18px] md:text-[20px] leading-tight mt-1">
          {event.name}
        </p>
      </div>

      {/* Play affordance overlay on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-ink-900/20">
        <div className="w-12 h-12 rounded-full bg-cream-100/95 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <Play size={18} className="text-rust-700 translate-x-[1px]" fill="currentColor" />
        </div>
      </div>
    </motion.button>
  );
}
