'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { EVENTS as RAW_EVENTS, type EventItem } from '@/data/events';

/**
 * EventRecap — body of the "02 / EVENT RECAP" folder.
 *
 *   - HORIZONTAL row of flyer-shaped cards (4:5 portrait, real flyer art).
 *     Scroll/drag left-right. Each card is the flyer.
 *   - Click a card → modal opens with the full recap (description, stats,
 *     venue, hero image, luma link).
 *   - Modal is portaled to <body> so it sits above the tabs.
 *
 * Data source: /data/events.ts — real flyers in /public/assets, real
 * attendee counts, real venues, real luma URLs.
 */

/* Sort newest first. Within the same date, keep original order. */
const EVENTS: EventItem[] = [...RAW_EVENTS].sort((a, b) => {
  return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
});

/* Format "2024-09-17" → "Sep 2024" */
function fmtMonth(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
}

/* Country code map for the chip */
const COUNTRY_CODE: Record<string, string> = {
  Singapore: 'SG',
  Thailand: 'TH',
  'United States': 'US',
  Taiwan: 'TW',
  'Hong Kong': 'HK',
  'South Korea': 'KR',
  'United Arab Emirates': 'AE',
  Italy: 'IT',
  France: 'FR',
};

/* Auto-derive 1-2 punchy kind tags per event from its name + description.
   No data changes needed — runs once per event. Colors are tuned to
   read on the dark plum bottom strip of the flyer card. */
type EventTag = { label: string; bg: string; fg: string };
const TAG_RULES: { match: RegExp; tag: EventTag }[] = [
  { match: /workshop|101|educational|learn/i,           tag: { label: 'WORKSHOP',   bg: 'rgba(188,211,197,0.95)', fg: '#1f3328' } },
  { match: /panel|summit|talk|speaker/i,                tag: { label: 'SUMMIT',     bg: 'rgba(217,199,238,0.95)', fg: '#2d1d3f' } },
  { match: /shuttle|bus|transport/i,                    tag: { label: 'SHUTTLE',    bg: 'rgba(217,199,238,0.95)', fg: '#2d1d3f' } },
  { match: /spa|wellness|massage|yoga/i,                tag: { label: 'WELLNESS',   bg: 'rgba(188,211,197,0.95)', fg: '#1f3328' } },
  { match: /basketball|cup|tournament|bowl|game/i,      tag: { label: 'SPORT',      bg: 'rgba(255,180,150,0.95)', fg: '#6b2218' } },
  { match: /hotpot|brunch|dinner|food|eat|edible/i,     tag: { label: 'DINNER',     bg: 'rgba(255,180,150,0.95)', fg: '#6b2218' } },
  { match: /offsite|retreat|villa/i,                    tag: { label: 'OFFSITE',    bg: 'rgba(188,211,197,0.95)', fg: '#1f3328' } },
  { match: /happy hour|honey hour|drinks|bar|rooftop|mixer|soir|night/i, tag: { label: 'NETWORKING', bg: 'rgba(244,168,193,0.95)', fg: '#6b1f3b' } },
];
function getEventTags(name: string, description: string): EventTag[] {
  const corpus = `${name} ${description}`;
  const found: EventTag[] = [];
  const seen = new Set<string>();
  for (const { match, tag } of TAG_RULES) {
    if (match.test(corpus) && !seen.has(tag.label)) {
      found.push(tag);
      seen.add(tag.label);
      if (found.length === 2) break;
    }
  }
  return found;
}

export default function EventRecap() {
  const [openId, setOpenId] = useState<string | null>(null);
  const openEvent = openId ? EVENTS.find((e) => e.id === openId) ?? null : null;
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    // Animate over ~450ms ourselves with an ease so it stays compatible
    // with the auto-drift loop (no `behavior: smooth` race condition).
    const start = el.scrollLeft;
    const delta = dir * Math.round(el.clientWidth * 0.7);
    const t0 = performance.now();
    const duration = 450;
    const ease = (p: number) => 1 - Math.pow(1 - p, 3);
    const step = () => {
      const p = Math.min(1, (performance.now() - t0) / duration);
      el.scrollLeft = start + delta * ease(p);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // SEAMLESS INFINITE STRIP + slow auto-drift.
  //
  // The strip renders the shuffled events 3x. We park the user in the
  // MIDDLE tile and silently snap back to it whenever the visible scroll
  // position crosses into the first or third tile. Two important things
  // that fix the glitch from the previous pass:
  //
  //   1. We READ tile width once after mount and cache it. Reading
  //      `scrollWidth` on every scroll event triggered layout thrash
  //      that fought the chevron's smooth animation and produced jitter.
  //   2. We only snap when the cursor crosses the SAME boundary that
  //      it just crossed — debounced with a flag — so a quick scroll
  //      doesn't ping-pong between back-edge and forward-edge snaps.
  //
  // A gentle ~12px/sec auto-drift runs while the user isn't interacting,
  // so the strip slowly slides on its own (paused on hover / touch / drag).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let tileWidth = 0;
    let snapping = false;          // true during a programmatic snap
    let driftRaf = 0;
    let lastDriftTs = 0;
    let userActive = false;        // user is hovering / touching
    let userActiveUntil = 0;       // resume drift this many ms after action
    let initRaf = 0;

    const measure = () => {
      tileWidth = el.scrollWidth / 3;
    };

    const seedPosition = () => {
      measure();
      // Park user at the start of the middle tile so they have
      // equal scroll headroom in both directions.
      el.scrollLeft = tileWidth;
    };

    // Seed on the second frame so the layout has resolved.
    initRaf = requestAnimationFrame(() => {
      requestAnimationFrame(seedPosition);
    });

    const onScroll = () => {
      if (snapping || tileWidth === 0) return;
      const left = el.scrollLeft;
      // If we drift into the third tile, jump back one tile width.
      // Padding the threshold (0.05 of tile) prevents bouncing.
      if (left > tileWidth * 2.05) {
        snapping = true;
        el.scrollLeft = left - tileWidth;
        // Release the lock next frame after the scroll event fires.
        requestAnimationFrame(() => { snapping = false; });
      } else if (left < tileWidth * 0.95) {
        snapping = true;
        el.scrollLeft = left + tileWidth;
        requestAnimationFrame(() => { snapping = false; });
      }
    };

    // Gentle auto-drift loop — only runs while the user isn't actively
    // interacting. Translates ~14px/sec to the right.
    const drift = (ts: number) => {
      if (!lastDriftTs) lastDriftTs = ts;
      const dt = ts - lastDriftTs;
      lastDriftTs = ts;
      const now = performance.now();
      if (!userActive && now > userActiveUntil && tileWidth > 0) {
        // px/sec → px/frame. 28 px/sec — visible drift, still calm.
        el.scrollLeft += (28 * dt) / 1000;
      }
      driftRaf = requestAnimationFrame(drift);
    };
    driftRaf = requestAnimationFrame(drift);

    // Only ACTIVE interactions (wheel, drag) pause drift — passive
    // hover does NOT. Otherwise the cursor sitting anywhere over the
    // wide flyer strip kills the drift permanently.
    const pause = (ms: number) => {
      userActiveUntil = Math.max(userActiveUntil, performance.now() + ms);
    };
    const onWheel = () => pause(1500);
    const onPointerDown = () => {
      userActive = true;
      pause(1500);
    };
    const onPointerUp = () => {
      userActive = false;
      pause(800);
    };
    const onResize = measure;

    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('wheel', onWheel, { passive: true });
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(initRaf);
      cancelAnimationFrame(driftRaf);
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div>
      {/* Eyebrow + chevron controls */}
      <div className="flex items-center justify-between mb-4">
        <p
          className="font-mono text-[11px] tracking-[0.3em]"
          style={{ color: 'rgba(var(--accent-rgb),0.85)' }}
        >
          ✦ EVENTS · SCROLL OR DRAG · CLICK A FLYER
        </p>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollBy(-1)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[rgba(var(--hi-rgb),0.5)]"
            style={{
              border: '1px solid rgba(var(--ink-rgb),0.2)',
              background: 'rgba(var(--paper-rgb),0.6)',
              color: 'rgba(var(--ink-rgb),0.7)',
            }}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollBy(1)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-[rgba(var(--hi-rgb),0.5)]"
            style={{
              border: '1px solid rgba(var(--ink-rgb),0.2)',
              background: 'rgba(var(--paper-rgb),0.6)',
              color: 'rgba(var(--ink-rgb),0.7)',
            }}
          >
            ›
          </button>
        </div>
      </div>

      {/* Horizontal flyer strip. Each card is sized to the flyer's natural
          4:5 portrait aspect. Snap-x so cards align nicely on scroll. */}
      <div className="relative">
        {/* Edge fade masks so the strip feels like a film roll */}
        <div
          aria-hidden
          className="recap-fade-left pointer-events-none absolute left-0 top-0 bottom-0 w-10 z-10"
        />
        <div
          aria-hidden
          className="recap-fade-right pointer-events-none absolute right-0 top-0 bottom-0 w-10 z-10"
        />

        {/* Hidden-scrollbar styles so the wrap-around teleport is
            invisible — visitors just see an endless strip of flyers. */}
        <style jsx>{`
          :global(.event-strip)::-webkit-scrollbar { display: none; }
          :global(.event-strip) {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
        `}</style>
        <div
          ref={scrollRef}
          // No `scroll-smooth` (it fights the auto-drift rAF loop) and
          // no `snap-x` (snap-mandatory also collides with continuous
          // drift). Result: a calm continuous slide instead of jitter.
          className="event-strip flex gap-4 overflow-x-auto pb-4"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* INFINITE-FEEL strip: render the events 3x so the row never
              feels like it ends. Newest first — deterministic so the
              strip is scannable. */}
          {Array.from({ length: 3 }).flatMap((_, rep) =>
            EVENTS.map((event) => (
              <div
                key={`${event.id}:rep-${rep}`}
                className="snap-start shrink-0"
                // Flyer-sized card: 4:5 portrait, sized so 2-3 cards fit
                // on desktop and the full flyer reads without being tiny.
                style={{ width: 'clamp(260px, 30vw, 340px)' }}
              >
                <FlyerCard event={event} onClick={() => setOpenId(event.id)} />
              </div>
            )),
          )}
        </div>
      </div>

      {/* Modal — portaled to <body> so it sits above the tabs. */}
      <EventModal event={openEvent} onClose={() => setOpenId(null)} />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   FlyerCard — full flyer (4:5 portrait) with a small caption strip below.
   Click anywhere to open the modal. Hover lifts slightly.
   ────────────────────────────────────────────────────────────────────── */
function FlyerCard({ event, onClick }: { event: EventItem; onClick: () => void }) {
  const flyer = event.photos[0];
  const country = COUNTRY_CODE[event.country] ?? event.country.slice(0, 3).toUpperCase();
  const tags = getEventTags(event.name, event.description);
  const hasMerch = !!event.merch && event.merch.length > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${event.name} recap`}
      className="group relative block w-full text-left rounded-[12px] overflow-hidden transition-transform duration-200 hover:-translate-y-1"
      style={{
        border: '1px solid rgba(var(--ink-rgb),0.18)',
        background: '#2A1320',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.18), 0 12px 26px -14px rgba(var(--ink-rgb),0.4)',
      }}
    >
      {/* TOP REGION — full-bleed flyer image. object-cover fills the
          frame edge-to-edge so there's no white letterboxing on the
          top/bottom. The title + tags sit BELOW in a separate solid
          strip so the flyer art is never obscured by text. */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: '1 / 1',
          background: '#1f0d18',
        }}
      >
        {flyer ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={flyer}
            alt={event.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl" aria-hidden>
            {event.emoji}
          </div>
        )}

        {/* TOP-LEFT: city · country chip — floats over the flyer, but
            small and tucked in the corner so it never crosses the art. */}
        {/* Literal colors — the chip floats on the photo, same in both themes */}
        <span
          className="absolute top-2.5 left-2.5 font-mono text-[9px] tracking-[0.2em] uppercase px-2 py-1 rounded-full"
          style={{
            background: 'rgba(253,249,242,0.92)',
            color: 'rgba(63,31,45,0.85)',
            border: '1px solid rgba(63,31,45,0.12)',
            boxShadow: '0 2px 6px -2px rgba(0,0,0,0.35)',
          }}
        >
          {event.city} · {country}
        </span>

        {/* TOP-RIGHT: merch flag if applicable */}
        {hasMerch && (
          <span
            className="absolute top-2.5 right-2.5 font-mono text-[8.5px] tracking-[0.22em] uppercase px-1.5 py-0.5 rounded-sm"
            style={{
              background: 'var(--ember-500)',
              color: '#fdf9f2',
              boxShadow: '0 2px 6px -2px rgba(0,0,0,0.4)',
            }}
          >
            ✦ merch
          </span>
        )}
      </div>

      {/* BOTTOM INFO STRIP — solid dark band, completely separate from
          the flyer art. Title is readable, tags sit as pills below.
          NO white space, NO text-on-image overlap. */}
      <div
        className="px-3 pt-2.5 pb-3"
        style={{
          background:
            'linear-gradient(180deg, #3F1F2D 0%, #2A1320 100%)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Title + month — italic display name + small mono date stamp */}
        <div className="flex items-baseline justify-between gap-2">
          <p
            className="font-display italic leading-tight truncate"
            style={{ color: '#fdf9f2', fontSize: 16 }}
          >
            {event.name}
          </p>
          <p
            className="font-mono text-[9px] tracking-[0.22em] uppercase shrink-0"
            style={{ color: 'rgba(255,180,150,0.85)' }}
          >
            {fmtMonth(event.startDate)}
          </p>
        </div>

        {/* Tags row — kind chips */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((t, i) => (
              <span
                key={i}
                className="font-mono text-[8.5px] tracking-[0.18em] uppercase px-1.5 py-0.5 rounded-sm"
                style={{
                  background: t.bg,
                  color: t.fg,
                  border: '1px solid rgba(255,255,255,0.14)',
                }}
              >
                {t.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   EventModal — full recap overlay. Portaled to <body>.
   ────────────────────────────────────────────────────────────────────── */
function EventModal({
  event,
  onClose,
}: {
  event: EventItem | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!event) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [event, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {event && (
        <motion.div
          key="event-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-10 cursor-pointer"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(63,31,45,0.78), rgba(63,31,45,0.92))',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.94, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 8, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl cursor-default"
          >
            <button
              onClick={onClose}
              aria-label="Close event recap"
              className="absolute -top-10 right-0 font-mono text-[12px] tracking-[0.22em] uppercase hover:text-ember-400 transition-colors flex items-center gap-2"
              style={{ color: 'rgba(253,249,242,0.8)' /* on dark scrim */ }}
            >
              <span aria-hidden>✕</span> close
            </button>

            <div
              className="rounded-[14px] overflow-hidden"
              style={{
                background: 'var(--paper-bright)',
                border: '1.5px solid rgba(var(--hi-rgb),0.85)',
                boxShadow: '0 24px 56px -20px rgba(0,0,0,0.6)',
              }}
            >
              {/* Header strip */}
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: '1px dashed rgba(var(--ink-rgb),0.18)' }}
              >
                <div className="flex items-baseline gap-3">
                  <span
                    className="font-mono text-[11px] tracking-[0.22em] uppercase"
                    style={{ color: 'rgba(var(--accent-rgb),0.85)' }}
                  >
                    RECAP
                  </span>
                  <span className="font-mono text-[11px]" style={{ color: 'rgba(var(--ink-rgb),0.4)' }}>•</span>
                  <span
                    className="font-mono text-[11px] tracking-[0.22em] uppercase"
                    style={{ color: 'rgba(var(--ink-rgb),0.55)' }}
                  >
                    {event.city} · {fmtMonth(event.startDate)}
                  </span>
                </div>
              </div>

              {/* Body — flyer column is now the WIDER side so the full
                  poster shows without cropping. */}
              <div className="px-6 md:px-8 py-7 max-h-[78vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-8">
                  {/* LEFT: copy + stats + link + merch */}
                  <div>
                    <h3
                      className="font-display italic leading-[1.05] mb-4"
                      style={{ color: 'var(--ink-strong)', fontSize: 'clamp(28px,4vw,42px)' }}
                    >
                      {event.name}
                    </h3>
                    {event.venue && (
                      <p
                        className="font-mono text-[11.5px] tracking-[0.18em] uppercase mb-4"
                        style={{ color: 'rgba(var(--ink-rgb),0.55)' }}
                      >
                        {event.venue}
                      </p>
                    )}
                    <p
                      className="font-sans text-[16px] leading-relaxed mb-6"
                      style={{ color: 'rgba(var(--ink-rgb),0.78)' }}
                    >
                      {event.description}
                    </p>

                    {/* WHAT I DID — case-study bullets (only on events
                        with `role` filled in data/events.ts) */}
                    {event.role && event.role.length > 0 && (
                      <div className="mb-6">
                        <p
                          className="font-mono text-[11px] tracking-[0.22em] uppercase mb-2"
                          style={{ color: 'rgba(var(--accent-rgb),0.85)' }}
                        >
                          ✦ WHAT I DID
                        </p>
                        <ul className="space-y-1.5">
                          {event.role.map((line, i) => (
                            <li
                              key={i}
                              className="flex items-baseline gap-3 font-sans text-[14.5px] leading-relaxed"
                              style={{ color: 'rgba(var(--ink-rgb),0.78)' }}
                            >
                              <span
                                aria-hidden
                                className="font-mono text-[11px] shrink-0"
                                style={{ color: 'var(--ember-500)' }}
                              >
                                ◇
                              </span>
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Stats grid */}
                    {event.stats && event.stats.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                        {event.stats.map((s, i) => (
                          <div
                            key={i}
                            className="rounded-md px-3 py-2.5"
                            style={{
                              background: 'rgba(var(--hi-rgb),0.45)',
                              border: '1px solid rgba(var(--ink-rgb),0.12)',
                            }}
                          >
                            <p
                              className="font-display italic leading-tight"
                              style={{ color: 'var(--ink-strong)', fontSize: 22 }}
                            >
                              {s.value}
                            </p>
                            <p
                              className="font-mono text-[9px] tracking-[0.18em] uppercase mt-0.5"
                              style={{ color: 'rgba(var(--ink-rgb),0.55)' }}
                            >
                              {s.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Links */}
                    {event.links && event.links.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {event.links.map((l, i) => (
                          <a
                            key={i}
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[11.5px] tracking-[0.22em] uppercase px-3 py-1.5 rounded-full transition-colors hover:bg-[rgba(var(--hi-rgb),0.5)]"
                            style={{
                              border: '1px solid rgba(var(--ink-rgb),0.25)',
                              background: 'rgba(var(--hi-rgb),0.4)',
                              color: 'var(--ink-strong)',
                            }}
                          >
                            ↗ {l.label}
                          </a>
                        ))}
                      </div>
                    )}

                    {/* MERCH / SWAG — only renders when the event actually
                        has merch in /data/events.ts. Add merch entries
                        there: { name, price?, icon?, link? }. */}
                    {event.merch && event.merch.length > 0 && (
                      <div>
                        <p
                          className="font-mono text-[11px] tracking-[0.22em] uppercase mb-2"
                          style={{ color: 'rgba(var(--accent-rgb),0.85)' }}
                        >
                          ✦ MERCH + SWAG
                        </p>
                        <ul className="flex flex-col gap-1.5">
                          {event.merch.map((m, i) => {
                            const RowEl: 'a' | 'div' = m.link ? 'a' : 'div';
                            return (
                              <li key={i}>
                                <RowEl
                                  {...(m.link
                                    ? {
                                        href: m.link,
                                        target: '_blank',
                                        rel: 'noopener noreferrer',
                                      }
                                    : {})}
                                  className="flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors hover:bg-[rgba(var(--hi-rgb),0.5)]"
                                  style={{
                                    background: 'rgba(var(--hi-rgb),0.4)',
                                    border: '1px solid rgba(var(--ink-rgb),0.12)',
                                  }}
                                >
                                  <span
                                    aria-hidden
                                    className="text-base shrink-0"
                                  >
                                    {m.icon ?? '🛍️'}
                                  </span>
                                  <span
                                    className="flex-1 font-sans text-[14px] truncate"
                                    style={{ color: 'rgba(var(--ink-rgb),0.85)' }}
                                  >
                                    {m.name}
                                  </span>
                                  {m.price && (
                                    <span
                                      className="font-mono text-[11px] tracking-[0.18em] shrink-0"
                                      style={{ color: 'rgba(var(--accent-rgb),0.85)' }}
                                    >
                                      {m.price}
                                    </span>
                                  )}
                                  {m.link && (
                                    <span
                                      className="font-mono text-[11px] shrink-0"
                                      style={{ color: 'rgba(var(--ink-rgb),0.4)' }}
                                    >
                                      ↗
                                    </span>
                                  )}
                                </RowEl>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* RIGHT: flyer column — sized to show the FULL poster
                      (object-contain instead of cover) so nothing is
                      cropped. Bigger column ratio than before. */}
                  <div className="flex flex-col gap-3">
                    {event.photos[0] ? (
                      <div
                        className="relative w-full overflow-hidden rounded-[8px] flex items-center justify-center"
                        style={{
                          border: '1px solid rgba(var(--ink-rgb),0.2)',
                          boxShadow:
                            'inset 0 0 0 2px var(--paper-bright), 0 12px 28px -18px rgba(0,0,0,0.4)',
                          background: 'rgba(var(--hi-rgb),0.45)',
                          minHeight: 360,
                          maxHeight: '68vh',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={event.photos[0]}
                          alt={event.name}
                          className="w-full h-auto max-h-[68vh] object-contain"
                          style={{ display: 'block' }}
                        />
                      </div>
                    ) : (
                      <div
                        className="relative w-full aspect-[4/5] rounded-[6px] flex items-center justify-center"
                        style={{
                          border: '1px solid rgba(var(--ink-rgb),0.2)',
                          background: 'rgba(var(--hi-rgb),0.4)',
                        }}
                      >
                        <span className="text-6xl" aria-hidden>{event.emoji}</span>
                      </div>
                    )}

                    {/* Second photo — also contained, smaller cap */}
                    {event.photos[1] && (
                      <div
                        className="relative w-full overflow-hidden rounded-[6px] flex items-center justify-center"
                        style={{
                          border: '1px solid rgba(var(--ink-rgb),0.2)',
                          boxShadow: 'inset 0 0 0 2px var(--paper-bright)',
                          background: 'rgba(var(--hi-rgb),0.4)',
                          minHeight: 180,
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={event.photos[1]}
                          alt={`${event.name} additional photo`}
                          className="w-full h-auto max-h-[40vh] object-contain"
                          style={{ display: 'block' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
