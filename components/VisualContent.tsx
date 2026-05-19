'use client';

/**
 * VisualContent — split-screen "watch + browse" section.
 *
 *   ┌──────────────────────────┬─────────────────────────────────┐
 *   │  card list (left)        │  active piece in a video/poster │
 *   │   - educational tag      │  player on the right            │
 *   │   - marketing tag        │                                 │
 *   │   - brand tag            │  CITY · title · caption · with… │
 *   │   - design tag           │                                 │
 *   └──────────────────────────┴─────────────────────────────────┘
 *
 * Picks a starting active piece, lets the user click any card to swap
 * the right-hand player. If the piece has a `video`, it plays muted /
 * autoplay / loop. Otherwise we fall back to the `poster` image.
 *
 * Why a separate section vs reusing Featured Events?
 *   - Featured Events sells the EVENT (the night, who came, what we shipped).
 *   - VisualContent sells the CRAFT (the design, the explainer, the brand).
 *     Different audience: hiring managers for design/marketing roles.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Play } from 'lucide-react';

import {
  VISUALS,
  CATEGORY_LABEL,
  CATEGORY_TONE,
  type VisualItem,
  type VisualCategory,
} from '@/data/visuals';

const ALL: VisualCategory | 'all' = 'all';

export default function VisualContent() {
  const [activeId, setActiveId] = useState<string>(VISUALS[0]?.id ?? '');
  const [filter, setFilter] = useState<VisualCategory | 'all'>(ALL);

  const filtered = filter === 'all' ? VISUALS : VISUALS.filter((v) => v.category === filter);
  const active = VISUALS.find((v) => v.id === activeId) ?? VISUALS[0];

  if (!active) return null;

  return (
    <section id="visuals" className="relative overflow-hidden">
      {/* Soft cream wash so PageGarden bleeds through */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(251,246,241,0.55), transparent 75%),' +
            'radial-gradient(ellipse 45% 60% at 0% 100%, rgba(232,121,160,0.14), transparent 60%),' +
            'radial-gradient(ellipse 35% 50% at 100% 0%, rgba(155,189,168,0.14), transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-12 py-20 md:py-28">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-6 mb-10">
          <div>
            <span className="eyebrow">visual content</span>
            <h2 className="font-display-italic text-rust-700 text-[40px] md:text-[56px] leading-[1.05] tracking-tight mt-3">
              things I&apos;ve <span className="text-sage-700">designed,</span><br />
              <span className="text-rust-500">explained,</span> and shipped.
            </h2>
            <p className="mt-3 text-ink-900/70 max-w-[58ch]">
              Graphics, explainers, and brand work — most of it built with the
              Infrared design team and outside collaborators. Click any tile on
              the left to swap the player.
            </p>
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-1.5">
            <CategoryPill active={filter === 'all'} onClick={() => setFilter('all')}>
              all
            </CategoryPill>
            {(['educational', 'marketing', 'brand', 'design'] as VisualCategory[]).map((c) => (
              <CategoryPill
                key={c}
                tone={CATEGORY_TONE[c]}
                active={filter === c}
                onClick={() => setFilter(c)}
              >
                {CATEGORY_LABEL[c]}
              </CategoryPill>
            ))}
          </div>
        </div>

        {/* Split: list left, player right */}
        <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-6 md:gap-8 items-start">
          {/* LEFT: scrollable card list */}
          <div className="relative rounded-2xl border border-rust-500/15 bg-white/55 backdrop-blur-sm shadow-[0_18px_42px_-22px_rgba(166,64,106,0.25)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-rust-500/10 bg-cream-100/60">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-rust-700">
                <span className="text-rust-500">❀</span> {filtered.length} piece{filtered.length === 1 ? '' : 's'}
              </p>
              <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-warm-500/80">
                scroll ↕
              </p>
            </div>
            <ul className="max-h-[520px] overflow-y-auto p-2 space-y-1.5">
              {filtered.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(v.id)}
                    className={`w-full text-left transition-all duration-300 ${
                      v.id === active.id ? 'opacity-100' : 'opacity-55 hover:opacity-90'
                    }`}
                  >
                    <VisualCard item={v} isActive={v.id === active.id} />
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="py-8 text-center text-[12px] text-warm-500/70">
                  nothing in this category yet — try another filter
                </li>
              )}
            </ul>
          </div>

          {/* RIGHT: video / poster player */}
          <PlayerPanel active={active} />
        </div>

        <p className="mt-8 text-[11px] uppercase tracking-[0.16em] text-warm-500/70 text-center">
          add new pieces in <code className="font-mono normal-case tracking-normal text-rust-700/80 bg-cream-200/60 px-1.5 py-0.5 rounded">data/visuals.ts</code>
        </p>
      </div>
    </section>
  );
}

/* ───────── Card ───────── */

function VisualCard({ item, isActive }: { item: VisualItem; isActive: boolean }) {
  const tone = CATEGORY_TONE[item.category];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, scale: isActive ? 1 : 0.98 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`relative flex items-start gap-3 px-3 py-2.5 rounded-2xl text-left transition-colors w-full cursor-pointer ${
        isActive
          ? 'bg-white border border-rust-500/15 shadow-[0_14px_36px_-20px_rgba(166,64,106,0.35)]'
          : 'bg-transparent hover:bg-white/40'
      }`}
    >
      {/* Thumbnail */}
      <div
        className="w-16 h-16 rounded-lg shrink-0 relative overflow-hidden border border-rust-500/10"
        style={{
          background:
            tone === 'rose'
              ? 'radial-gradient(ellipse 70% 60% at 50% 60%, #E879A0 0%, #F2B4C7 40%, #FCE4EC 75%, #FFFFFF 100%)'
              : 'radial-gradient(ellipse 70% 60% at 50% 60%, #9BBDA8 0%, #BCD3C5 40%, #EEF5F0 75%, #FFFFFF 100%)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.thumbnail}
          alt={item.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {item.video && (
          <span className="absolute inset-0 flex items-center justify-center bg-ink-900/30">
            <Play size={16} className="text-white drop-shadow" fill="currentColor" />
          </span>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={`font-mono text-[9px] uppercase tracking-[0.16em] px-1.5 py-0.5 rounded-full ${
              tone === 'rose' ? 'bg-rust-100 text-rust-700' : 'bg-sage-100 text-sage-700'
            }`}
          >
            {CATEGORY_LABEL[item.category]}
          </span>
          {item.date && (
            <span className="font-mono text-[10px] text-warm-500/80">{item.date}</span>
          )}
        </div>
        <p className={`leading-tight ${isActive ? 'text-ink-900 text-[14px] font-semibold' : 'text-ink-900/75 text-[13.5px]'}`}>
          {item.title}
        </p>
        <p className="text-[12px] text-warm-500/85 leading-snug mt-1 line-clamp-2">
          {item.caption}
        </p>
      </div>
    </motion.div>
  );
}

/* ───────── Player ───────── */

function PlayerPanel({ active }: { active: VisualItem }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-rust-500/15 bg-ink-900 shadow-[0_24px_60px_-24px_rgba(45,22,34,0.55)]">
      {/* Media */}
      <div className="relative aspect-[16/10] bg-ink-900">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            {active.video ? (
              isEmbedUrl(active.video) ? (
                <iframe
                  src={active.video}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  title={active.title}
                />
              ) : (
                <video
                  key={active.video}
                  src={active.video}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster={active.poster}
                />
              )
            ) : (
              // No video — show poster, but treat the panel like a media slot
              // with a subtle play affordance so the design language is consistent.
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={active.poster ?? active.thumbnail}
                  alt={active.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/55 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-cream-100/85 backdrop-blur-sm rounded-full px-2.5 py-1 text-rust-700 text-[9.5px] uppercase tracking-[0.16em]">
                  <span className="w-1 h-1 rounded-full bg-rust-500" />
                  poster · video coming soon
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom caption */}
      <div className="px-5 py-4 bg-ink-900 text-cream-100">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-rust-300/80">
          <span>{CATEGORY_LABEL[active.category]}</span>
          {active.date && (
            <>
              <span className="text-rust-300/40">·</span>
              <span>{active.date}</span>
            </>
          )}
        </div>
        <h3 className="font-display-italic text-rust-200 text-[22px] md:text-[26px] leading-tight mt-1">
          {active.title}
        </h3>
        <p className="text-cream-100/75 text-[13.5px] leading-snug mt-2 max-w-[58ch]">
          {active.caption}
        </p>
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          {active.with && (
            <span className="font-mono text-[10.5px] tracking-wider text-cream-100/55">
              {active.with}
            </span>
          )}
          {active.link && (
            <a
              href={active.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] text-rust-300 hover:text-rust-200 transition-colors"
            >
              view <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────── helpers ───────── */

function isEmbedUrl(src: string): boolean {
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com)/.test(src);
}

/* ───────── Category pill ───────── */

function CategoryPill({
  tone,
  active = false,
  onClick,
  children,
}: {
  tone?: 'rose' | 'sage';
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const styles = active
    ? tone === 'sage'
      ? 'bg-sage-100 text-sage-700 border-sage-300/60'
      : tone === 'rose'
        ? 'bg-rust-100 text-rust-700 border-rust-200'
        : 'bg-rust-500 text-white border-rust-500'
    : 'bg-white/70 text-warm-500 border-warm-300/40 hover:bg-rust-100/40';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[11px] px-3 py-1 rounded-full border transition-colors ${styles}`}
    >
      {children}
    </button>
  );
}
