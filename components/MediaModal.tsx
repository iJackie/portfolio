'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * MediaModal — universal media overlay shared by EventRecap + ContentBento.
 *
 * Handles every "media that opens full-presence" type:
 *   - video        : an mp4 / webm hosted in /public (or any direct URL)
 *   - youtube      : a YouTube video ID — embeds the official iframe
 *   - image        : a png / jpg — displayed at fit
 *   - graphic      : same as image but rendered larger / with a paper frame
 *
 * Branded with peach × lavender backdrop tint + paper edge so it doesn't
 * feel like a generic black-overlay modal.
 *
 * Closes on:
 *   - Escape key
 *   - Click outside the content
 *   - X button top-right
 */

export type MediaKind = 'video' | 'youtube' | 'image' | 'graphic';

export type MediaContent = {
  kind: MediaKind;
  /** For video: path to mp4/webm. For youtube: the video ID. For image/graphic: image src. */
  src: string;
  /** Optional poster image for video tiles */
  poster?: string;
  title?: string;
  caption?: string;
  /** Optional eyebrow shown above the title (e.g. "REEL · 2024"). */
  eyebrow?: string;
};

export default function MediaModal({
  media,
  onClose,
}: {
  media: MediaContent | null;
  onClose: () => void;
}) {
  // Track mount for portal — SSR can't render to document.body.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Close on Escape
  useEffect(() => {
    if (!media) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    // Lock body scroll while open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [media, onClose]);

  if (!mounted) return null;

  // PORTAL the modal into document.body. Without this, the modal lives
  // inside the FolderTabs panel's `motion.div`, whose transform creates
  // a new stacking context — that turns `position: fixed` into
  // `position: absolute` relative to the panel, so tabs sit on top of
  // the backdrop. Portaling out to body fixes the layering once and for all.
  return createPortal(
    <AnimatePresence>
      {media && (
        <motion.div
          key="media-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-10 cursor-pointer"
          style={{
            // Peach × lavender tinted backdrop, not flat black
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
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl cursor-default"
          >
            {/* CLOSE button — top-right, outside the paper frame */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute -top-12 right-0 font-mono text-[11px] tracking-[0.22em] uppercase text-paper-50/80 hover:text-ember-400 transition-colors flex items-center gap-2"
            >
              <span aria-hidden>✕</span>
              close
            </button>

            {/* PAPER FRAME wrapping the media */}
            <div
              className="relative rounded-[14px] overflow-hidden"
              style={{
                background: 'var(--paper-bright)',
                border: '1.5px solid rgba(var(--hi-rgb),0.85)',
                boxShadow: '0 24px 56px -20px rgba(0,0,0,0.6)',
              }}
            >
              {/* Paper grain */}
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'180\' height=\'180\'><filter id=\'g\'><feTurbulence baseFrequency=\'0.95\' numOctaves=\'2\' seed=\'4\'/><feColorMatrix values=\'0 0 0 0 0.25  0 0 0 0 0.18  0 0 0 0 0.18  0 0 0 0.16 0\'/></filter><rect width=\'180\' height=\'180\' filter=\'url(%23g)\'/></svg>")',
                  opacity: 0.3,
                  mixBlendMode: 'multiply',
                }}
              />

              <div className="relative p-4 md:p-6">
                {/* Eyebrow + title strip */}
                {(media.eyebrow || media.title) && (
                  <div className="mb-3 flex items-baseline gap-3 px-1">
                    {media.eyebrow && (
                      <span
                        className="font-mono text-[10px] tracking-[0.22em] uppercase"
                        style={{ color: 'rgba(var(--accent-rgb),0.85)' }}
                      >
                        {media.eyebrow}
                      </span>
                    )}
                    {media.title && (
                      <h3
                        className="font-display italic text-[clamp(20px,2.6vw,30px)] leading-tight"
                        style={{ color: 'var(--ink-strong)' }}
                      >
                        {media.title}
                      </h3>
                    )}
                  </div>
                )}

                {/* Media body */}
                <MediaBody media={media} />

                {/* Caption */}
                {media.caption && (
                  <p
                    className="mt-4 px-1 font-sans text-[14px] leading-relaxed max-w-2xl"
                    style={{ color: 'rgba(var(--ink-rgb),0.7)' }}
                  >
                    {media.caption}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function MediaBody({ media }: { media: MediaContent }) {
  switch (media.kind) {
    case 'video':
      return (
        <video
          src={media.src}
          poster={media.poster}
          controls
          autoPlay
          playsInline
          className="w-full h-auto max-h-[70vh] rounded-[6px] bg-ink-900"
          style={{ display: 'block' }}
        />
      );

    case 'youtube':
      return (
        <div
          className="relative w-full overflow-hidden rounded-[6px] bg-ink-900"
          style={{ paddingBottom: '56.25%' }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${media.src}?autoplay=1&rel=0`}
            title={media.title ?? 'YouTube video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            style={{ border: 0 }}
          />
        </div>
      );

    case 'image':
    case 'graphic':
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.src}
          alt={media.title ?? ''}
          className="w-full h-auto max-h-[70vh] object-contain rounded-[6px]"
          style={{ display: 'block' }}
        />
      );

    default:
      return null;
  }
}
