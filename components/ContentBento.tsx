'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MediaModal, { type MediaContent, type MediaKind } from '@/components/MediaModal';
import { MERCH } from '@/data/merch';

/**
 * ContentBento — body of the "03 / CONTENT" folder.
 *
 * Mixed-size bento grid of every kind of content Jacqueline ships:
 *   - REEL       (vertical mp4) — opens in modal
 *   - YOUTUBE    (yt video id)  — opens in modal
 *   - IMAGE      (still / photo) — opens in modal
 *   - GRAPHIC    (zine / poster) — opens in modal
 *   - TWEET      (twitter url)   — opens in NEW TAB
 *   - THREAD     (twitter url)   — opens in NEW TAB
 *   - PODCAST    (external url)  — opens in NEW TAB
 *   - TALK       (mp4 or yt)     — opens in modal
 *
 * Each tile carries:
 *   - `kind`     — picks the modal vs new-tab behavior
 *   - `span`     — controls bento footprint (col/row spans)
 *   - `aspect`   — visual aspect ratio inside the tile
 *
 * To add a piece of content: append to CONTENT_ITEMS. That's it.
 *
 * Filter chips at the top let visitors narrow by category. Layout uses
 * framer-motion `layoutId` so tiles slide into new positions smoothly
 * when filters change.
 */

// ─────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────
type ContentKind =
  | 'reel'
  | 'youtube'
  | 'image'
  | 'graphic'
  | 'tweet'
  | 'thread'
  | 'podcast'
  | 'talk';

type ContentSpan = 'sm' | 'md' | 'lg' | 'tall' | 'wide';

type ContentItem = {
  id: string;
  kind: ContentKind;
  /** Display label / caption */
  title: string;
  /** For modal-kinds: src (video path / YT id / image src). For external-kinds: full url. */
  src: string;
  /** Optional poster image for video tiles (also used as the still tile preview) */
  thumb?: string;
  /** Optional date / context line */
  eyebrow?: string;
  /** Optional caption shown in modal */
  caption?: string;
  /** Tile footprint in the bento grid */
  span: ContentSpan;
};

// Map content kind → modal kind (only for kinds that open in modal)
const KIND_TO_MEDIA: Partial<Record<ContentKind, MediaKind>> = {
  reel: 'video',
  talk: 'video',
  youtube: 'youtube',
  image: 'image',
  graphic: 'graphic',
};

// Which kinds open externally (new tab)
const EXTERNAL_KINDS: ContentKind[] = ['tweet', 'thread', 'podcast'];

// ─────────────────────────────────────────────────────────────────────
// FILTER CHIPS
// ─────────────────────────────────────────────────────────────────────
type FilterKey = 'all' | 'video' | 'graphics' | 'posts' | 'talks' | 'merch';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',      label: 'ALL' },
  { key: 'video',    label: 'VIDEO' },
  { key: 'graphics', label: 'GRAPHICS' },
  { key: 'merch',    label: 'MERCH' },
  { key: 'posts',    label: 'POSTS' },
  { key: 'talks',    label: 'TALKS' },
];

function itemMatchesFilter(item: ContentItem, filter: FilterKey): boolean {
  if (filter === 'all') return true;
  if (filter === 'video')    return item.kind === 'reel' || item.kind === 'youtube';
  if (filter === 'graphics') return item.kind === 'image' || item.kind === 'graphic';
  if (filter === 'posts')    return item.kind === 'tweet' || item.kind === 'thread';
  if (filter === 'talks')    return item.kind === 'talk' || item.kind === 'podcast';
  // 'merch' is handled OUTSIDE this filter: when filter === 'merch', the
  // grid switches to render items derived from data/merch.ts instead of
  // CONTENT_ITEMS. See the render below.
  return true;
}

/**
 * Convert a MerchItem into a ContentItem shape so we can reuse the
 * bento tile renderer. Merch tiles open in the image modal.
 */
function merchToContentItems(): ContentItem[] {
  // Rotate spans so the merch grid doesn't come out as a straight
  // row of same-size tiles.
  const spans: ContentSpan[] = ['sm', 'md', 'sm', 'sm', 'md', 'sm'];
  return MERCH.map((m, i) => ({
    id: `merch--${m.id}`,
    kind: 'image' as const,
    title: m.name,
    src: m.photo,
    thumb: m.photo,
    eyebrow: m.category ? m.category.toUpperCase() : 'MERCH',
    caption: m.description,
    span: spans[i % spans.length],
  }));
}

// ─────────────────────────────────────────────────────────────────────
// CONTENT_ITEMS — wired to real assets in /public/assets.
//
// Quick edit guide:
//   - Add a new tile → append a block to this array.
//   - Swap a file → replace the `src` (and `thumb` if it's a video).
//   - Change grid footprint → `span`: sm | md | lg | tall | wide.
//   - `kind` decides what happens on click:
//       reel / youtube / talk      → opens in MediaModal
//       graphic / image            → opens in MediaModal
//       tweet / thread / podcast   → opens externally in a new tab
//
// FILENAME CONVENTIONS used here:
//   videoTeaser_*  → short teasers (vertical / 9:16 → use span 'tall')
//   video_*        → longer cuts / educational videos
//   meme_*         → meme graphics
//   design_*       → brand designs, posters, kits
//   merch_*        → product/merch shots
// ─────────────────────────────────────────────────────────────────────
const CONTENT_ITEMS: ContentItem[] = [
  // ── VIDEO TEASERS (KBW shuttle bus, etc) ──────────────────────────
  {
    id: 'video-teaser-bus-1',
    kind: 'reel',
    title: 'KBW Shuttle Teaser, Vol. 1',
    src: '/assets/content/videos/videoTeaser_Teaser1Bus.mp4',
    // For mp4 reels: a static thumb image makes the grid much faster.
    // Replace with a real screenshot when you have one.
    thumb: '/assets/events/2025-seoul-kbw/flyer_KBWShuttle.avif',
    eyebrow: 'TEASER · KBW 2025',
    caption: 'Pre-launch teaser for the Infrared × Lair shuttle.',
    span: 'tall',
  },
  {
    id: 'video-teaser-bus-2',
    kind: 'reel',
    title: 'KBW Shuttle Teaser, Vol. 2',
    src: '/assets/content/videos/videoTeaser_Teaser2Bus.mp4',
    thumb: '/assets/events/2025-seoul-kbw/flyer_KBWShuttle.avif',
    eyebrow: 'TEASER · KBW 2025',
    caption: 'Second cut, built for the IG drop.',
    span: 'tall',
  },

  // ── PRODUCT / FEATURE VIDEOS ──────────────────────────────────────
  // Web-ready 720p transcodes (~6–8 MB each); raw exports live in _originals/.
  {
    id: 'video-tge',
    kind: 'reel',
    title: 'TGE Launch',
    src: '/assets/content/videos/video_TGE.mp4',
    thumb: '/assets/content/memes/TeddyInfrared.webp',
    eyebrow: 'LAUNCH VIDEO',
    caption: 'Launch reel for the Infrared TGE.',
    span: 'lg',
  },
  {
    id: 'video-points-kickoff',
    kind: 'reel',
    title: 'Points Kickoff',
    src: '/assets/content/videos/video_PointsKickoff.mp4',
    thumb: '/assets/content/designs/Bear1.webp',
    eyebrow: 'PRODUCT',
    caption: 'Kickoff video for the Infrared Points program.',
    span: 'md',
  },
  {
    id: 'video-ibera-unstaking',
    kind: 'reel',
    title: 'iBERA Unstaking Module',
    src: '/assets/content/videos/video_iBERAUnstaking.mp4',
    thumb: '/assets/content/designs/Bear1.webp',
    eyebrow: 'EDUCATIONAL',
    caption: 'Walkthrough for the iBERA unstaking flow (captioned).',
    span: 'md',
  },
  {
    id: 'video-withdrawal',
    kind: 'reel',
    title: 'Infrared Withdrawal Flow',
    src: '/assets/content/videos/video_InfraredWithdrawl.mp4',
    thumb: '/assets/content/designs/Bear1.webp',
    eyebrow: 'EDUCATIONAL',
    caption: 'Walkthrough of the withdrawal process.',
    span: 'sm',
  },
  {
    id: 'video-redemption',
    kind: 'reel',
    title: '1.8 Public Redemption',
    src: '/assets/content/videos/video_PublicRedemption.mp4',
    thumb: '/assets/content/designs/Bear1.webp',
    eyebrow: 'PRODUCT',
    caption: 'Cut explaining the v1.8 public redemption window.',
    span: 'sm',
  },

  // ── DESIGNS — brand kits, posters, GTM decks ──────────────────────
  {
    id: 'design-incubator-scene',
    kind: 'graphic',
    title: 'Infrared Incubator Scene v5',
    src: '/assets/content/designs/IncubatorScene.webp',
    thumb: '/assets/content/designs/IncubatorScene.webp',
    eyebrow: 'DESIGN',
    caption: 'Brand scene art for the Incubator program (v5).',
    span: 'lg',
  },
  {
    id: 'design-korean-gtm',
    kind: 'graphic',
    title: 'Korea GTM Cover',
    src: '/assets/content/designs/KoreanGTM.webp',
    thumb: '/assets/content/designs/KoreanGTM.webp',
    eyebrow: 'GTM · 2025',
    caption: 'Cover art for the Korea GTM deck.',
    span: 'wide',
  },
  {
    id: 'design-tablecloth',
    kind: 'graphic',
    title: 'Infrared Tablecloth',
    src: '/assets/content/designs/InfraredTablecloth.webp',
    thumb: '/assets/content/designs/InfraredTablecloth.webp',
    eyebrow: 'EVENT DESIGN',
    caption: 'Custom event tablecloth design.',
    span: 'md',
  },
  {
    id: 'design-bear-1',
    kind: 'graphic',
    title: 'Bear v1',
    src: '/assets/content/designs/Bear1.webp',
    thumb: '/assets/content/designs/Bear1.webp',
    eyebrow: 'BRAND',
    caption: 'Brand bear illustration (v1).',
    span: 'sm',
  },
  {
    id: 'design-drink-bear-sticker',
    kind: 'graphic',
    title: 'Drink Bear Pegatina (Sticker)',
    src: '/assets/content/designs/DrinkBearPegatina.webp',
    thumb: '/assets/content/designs/DrinkBearPegatina.webp',
    eyebrow: 'STICKER',
    caption: 'Sticker art for the drink-bear merch series.',
    span: 'sm',
  },
  {
    id: 'design-liquid-staking-advantage',
    kind: 'graphic',
    title: 'Liquid Staking Advantage',
    src: '/assets/events/2024-singapore-liquidstaking/flyer_LiquidStakingAdvantage.webp',
    thumb: '/assets/events/2024-singapore-liquidstaking/flyer_LiquidStakingAdvantage.webp',
    eyebrow: 'POSTER',
    caption: 'Side-event collateral on the LST advantage.',
    span: 'sm',
  },

  // ── MEMES ─────────────────────────────────────────────────────────
  {
    id: 'meme-teddy-infrared',
    kind: 'graphic',
    title: 'Teddy x Infrared',
    src: '/assets/content/memes/TeddyInfrared.webp',
    thumb: '/assets/content/memes/TeddyInfrared.webp',
    eyebrow: 'MEME',
    caption: 'Community meme drop, Teddy era.',
    span: 'sm',
  },
  {
    id: 'meme-honey-mining',
    kind: 'graphic',
    title: 'Honey Mining',
    src: '/assets/content/memes/HoneyMining.webp',
    thumb: '/assets/content/memes/HoneyMining.webp',
    eyebrow: 'MEME',
    caption: 'Honey-mining moment captured.',
    span: 'sm',
  },

  // ── MERCH shots moved to /data/merch.ts — see MERCH filter chip.

  // ── MISC / R&D ────────────────────────────────────────────────────
  {
    id: 'design-vape-study',
    kind: 'graphic',
    title: 'Vape Study · 1',
    src: '/assets/content/designs/VapeStudy1.webp',
    thumb: '/assets/content/designs/VapeStudy1.webp',
    eyebrow: 'STUDY',
    caption: 'Concept study for a future merch run.',
    span: 'sm',
  },

  // ── PLACEHOLDER POSTS (replace with real tweet/thread URLs) ───────
  {
    id: 'tweet-hosting',
    kind: 'tweet',
    title: '[TODO] Tweet on hosting',
    src: 'https://twitter.com/berakana_',
    thumb: '/assets/content/memes/TeddyInfrared.webp',
    eyebrow: 'TWITTER',
    span: 'sm',
  },
  {
    id: 'thread-20-events',
    kind: 'thread',
    title: '[TODO] On running 20+ events',
    src: 'https://twitter.com/berakana_',
    thumb: '/assets/content/memes/HoneyMining.webp',
    eyebrow: 'THREAD',
    span: 'sm',
  },
];

// ─────────────────────────────────────────────────────────────────────
// VIDEO FIRST-FRAME SNAPSHOT
//
// For mp4 tiles, we want a UNIQUE thumbnail per video instead of every
// reel sharing the same fallback brand image. This hook spins up a
// hidden <video>, seeks to ~0.4s, draws that frame to an offscreen
// canvas, and returns a data URL we can drop into <img src>.
//
// Cached on `module` scope so each video only snapshots once per page
// load even if its tile is re-rendered via filter changes.
// ─────────────────────────────────────────────────────────────────────
const thumbCache = new Map<string, string>();

function useVideoThumbnail(src: string | undefined): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(
    src ? thumbCache.get(src) ?? null : null,
  );

  useEffect(() => {
    if (!src) return;
    // Only handle local mp4 files (skip YouTube IDs, external URLs).
    if (!src.startsWith('/') && !src.startsWith('http')) return;
    if (!/\.(mp4|webm|mov|m4v)(\?|$)/i.test(src)) return;
    if (thumbCache.has(src)) {
      setDataUrl(thumbCache.get(src)!);
      return;
    }

    let cancelled = false;
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;
    // playsInline lets iOS/Safari decode without entering fullscreen
    video.playsInline = true;
    video.src = src;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
    };

    const onLoaded = () => {
      // Seek a touch into the file so we skip any black-frame intro.
      try {
        video.currentTime = Math.min(0.4, (video.duration || 1) * 0.05);
      } catch {
        // If seek throws, fall back to drawing whatever's loaded.
        capture();
      }
    };

    const capture = () => {
      if (cancelled) return;
      try {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) {
          cleanup();
          return;
        }
        // Scale down to a reasonable thumb size so the data URL stays small.
        const targetW = Math.min(720, w);
        const scale = targetW / w;
        const targetH = Math.round(h * scale);
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          return;
        }
        ctx.drawImage(video, 0, 0, targetW, targetH);
        const url = canvas.toDataURL('image/jpeg', 0.82);
        thumbCache.set(src, url);
        if (!cancelled) setDataUrl(url);
      } catch {
        // canvas tainting (CORS), unsupported codec, etc. — silently
        // fall back to the static thumb the tile already has.
      } finally {
        cleanup();
      }
    };

    video.addEventListener('loadedmetadata', onLoaded, { once: true });
    video.addEventListener('seeked', capture, { once: true });
    video.addEventListener('error', cleanup, { once: true });

    return () => {
      cancelled = true;
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('seeked', capture);
      video.removeEventListener('error', cleanup);
      cleanup();
    };
  }, [src]);

  return dataUrl;
}

/* TileThumbnail — picks the right thumbnail source for a tile:
   - For video tiles, prefer the auto-generated snapshot.
   - Falls back to the static `thumb` if snapshotting isn't possible
     (CORS, unsupported codec, non-mp4 src, etc).
   This is what every tile renders instead of a raw <img>. */
function TileThumbnail({
  item,
}: {
  item: ContentItem;
}) {
  const isVideoKind = item.kind === 'reel' || item.kind === 'talk';
  const isLocalMp4 =
    isVideoKind &&
    /\.(mp4|webm|mov|m4v)(\?|$)/i.test(item.src) &&
    (item.src.startsWith('/') || item.src.startsWith('http'));
  const snapshot = useVideoThumbnail(isLocalMp4 ? item.src : undefined);
  const src = snapshot ?? item.thumb;
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={item.title} className="bento-tile__img" loading="lazy" />
  );
}

// ─────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────
export default function ContentBento() {
  const [filter, setFilter] = useState<FilterKey>('all');
  const [openMedia, setOpenMedia] = useState<MediaContent | null>(null);

  // Randomize the order PER VISIT — Fisher-Yates shuffle, memoized so
  // the order stays stable across renders within a single page load
  // but feels fresh every reload. Returning visitors see a different
  // mix without us having to manually re-curate the array.
  const shuffledContent = useMemo(() => {
    const arr = [...CONTENT_ITEMS];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, []);

  // MERCH filter is special: instead of filtering CONTENT_ITEMS, we
  // swap the tile source to entries derived from data/merch.ts so the
  // Content tab has a dedicated merch view without duplicating data.
  const merchItems = useMemo(() => merchToContentItems(), []);

  const filteredItems = useMemo(
    () =>
      filter === 'merch'
        ? merchItems
        : shuffledContent.filter((it) => itemMatchesFilter(it, filter)),
    [filter, shuffledContent, merchItems],
  );

  const handleTileClick = (item: ContentItem) => {
    if (EXTERNAL_KINDS.includes(item.kind)) {
      window.open(item.src, '_blank', 'noopener,noreferrer');
      return;
    }
    const mediaKind = KIND_TO_MEDIA[item.kind];
    if (!mediaKind) return;
    setOpenMedia({
      kind: mediaKind,
      src: item.src,
      poster: item.thumb,
      title: item.title,
      caption: item.caption,
      eyebrow: item.eyebrow,
    });
  };

  return (
    <>
      {/* Eyebrow */}
      <p
        className="font-mono text-[10px] tracking-[0.3em] mb-3"
        style={{ color: 'rgba(var(--accent-rgb),0.85)' }}
      >
        ✦ REELS, TALKS, POSTS, GRAPHICS
      </p>

      {/* Filter chip row */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`bento-chip ${active ? 'bento-chip--active' : ''}`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Bento grid */}
      <div className="bento-grid">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => (
            <motion.button
              key={item.id}
              layout
              layoutId={item.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{
                layout: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.25 },
                scale: { duration: 0.3 },
              }}
              onClick={() => handleTileClick(item)}
              className={`bento-tile bento-tile--${item.span}`}
              aria-label={`Open ${item.title}`}
            >
              {/* Thumbnail — for video tiles this captures the first
                  frame at runtime so each reel has its own unique
                  preview. For everything else it just renders the
                  static `thumb`. */}
              <TileThumbnail item={item} />

              {/* Hover overlay */}
              <div className="bento-tile__overlay" />

              {/* Kind tag */}
              <span className="bento-tile__kind">
                {item.kind.toUpperCase()}
              </span>

              {/* External-link icon for tweets/threads/podcasts */}
              {EXTERNAL_KINDS.includes(item.kind) && (
                <span className="bento-tile__ext" aria-hidden>↗</span>
              )}

              {/* Play badge for video kinds */}
              {(item.kind === 'reel' || item.kind === 'youtube' || item.kind === 'talk') && (
                <span className="bento-tile__play" aria-hidden>▶</span>
              )}

              {/* Caption strip at bottom */}
              <div className="bento-tile__caption">
                {item.eyebrow && (
                  <span className="bento-tile__eyebrow">{item.eyebrow}</span>
                )}
                <span className="bento-tile__title">{item.title}</span>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal — handles video/youtube/image/graphic */}
      <MediaModal media={openMedia} onClose={() => setOpenMedia(null)} />
    </>
  );
}
