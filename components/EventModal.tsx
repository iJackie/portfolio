'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, ExternalLink, Plus, ShoppingBag, Camera } from 'lucide-react';
import type { EventItem } from '@/data/events';

type Props = {
  event: EventItem | null;
  onClose: () => void;
};

export default function EventModal({ event, onClose }: Props) {
  useEffect(() => {
    if (!event) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [event, onClose]);

  // Pad photos array so we always render a few slots (real or placeholder)
  const photoSlots = event ? [...event.photos.slice(1).filter(Boolean), ...Array(Math.max(0, 4 - event.photos.slice(1).filter(Boolean).length)).fill(null)] : [];
  const merch = event?.merch ?? [];
  const merchSlots = [...merch, ...Array(Math.max(0, 3 - merch.length)).fill(null)];

  return (
    <AnimatePresence>
      {event && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 md:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-ink-900/55 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-cream-100 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-rust-500/10"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full glass flex items-center justify-center text-ink-900 hover:bg-rust-100 transition-colors"
            >
              <X size={16} />
            </button>

            {/* Hero image */}
            <div className="relative aspect-[16/9] bg-cream-200 overflow-hidden rounded-t-3xl">
              {event.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.photos[0]}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full grainy-soft flex items-center justify-center text-6xl">
                  {event.emoji}
                </div>
              )}
            </div>

            <div className="p-6 md:p-10">
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-sage-700 mb-3">
                <span className="inline-flex items-center gap-1"><MapPin size={12} /> {event.location}</span>
                <span className="w-1 h-1 rounded-full bg-rust-300" />
                <span className="inline-flex items-center gap-1"><Calendar size={12} /> {formatDateRange(event.startDate, event.endDate)}</span>
                {event.venue && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-rust-300" />
                    <span>{event.venue}</span>
                  </>
                )}
              </div>

              <h2 className="font-display-italic text-rust-700 text-3xl md:text-5xl leading-tight">
                {event.name}
              </h2>

              <p className="mt-5 text-ink-900/80 leading-[1.7] max-w-[64ch]">
                {event.description}
              </p>

              {/* Stats */}
              {event.stats.length > 0 && (
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {event.stats.map((s) => (
                    <div
                      key={s.label}
                      className="bg-white rounded-xl p-4 border border-rust-500/10"
                    >
                      <div className="font-display-italic text-rust-700 text-2xl md:text-3xl leading-none">
                        {s.value}
                      </div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.1em] text-warm-500">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Photos */}
              <div className="mt-10">
                <div className="flex items-center gap-2 mb-4">
                  <Camera size={14} className="text-rust-500" />
                  <p className="eyebrow !text-[10px] !py-1 !px-2.5">photos from the night</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {photoSlots.map((p, i) => (
                    <div
                      key={i}
                      className="relative aspect-square rounded-xl overflow-hidden bg-cream-200 border border-rust-500/10"
                    >
                      {p ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <PlaceholderSlot label="add photo" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Merch */}
              <div className="mt-10">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingBag size={14} className="text-rust-500" />
                  <p className="eyebrow !text-[10px] !py-1 !px-2.5">merch & drops</p>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {merchSlots.map((m, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-xl overflow-hidden border border-rust-500/10"
                    >
                      <div className="relative aspect-square bg-cream-100">
                        {m?.icon && /^\/|^https?:/.test(m.icon) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={m.icon} alt={m.name} className="w-full h-full object-cover" />
                        ) : m ? (
                          <div className="absolute inset-0 grainy-soft flex items-center justify-center text-3xl">
                            {m.icon ?? '👕'}
                          </div>
                        ) : (
                          <PlaceholderSlot label="add merch" />
                        )}
                      </div>
                      <div className="p-3">
                        <p className={`text-[12px] ${m ? 'text-ink-900' : 'text-warm-500/70'}`}>
                          {m?.name ?? '(open slot)'}
                        </p>
                        {m?.price && (
                          <p className="text-[10px] text-rust-700 mt-0.5">{m.price}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-warm-500 italic">
                  drop new images into{' '}
                  <code className="font-mono text-[10px] bg-cream-200 px-1 py-0.5 rounded">/public/assets/</code>{' '}
                  and add to the event in{' '}
                  <code className="font-mono text-[10px] bg-cream-200 px-1 py-0.5 rounded">data/events.ts</code>.
                </p>
              </div>

              {/* Links */}
              {event.links && event.links.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {event.links.map((l) => (
                    <a
                      key={l.url}
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost !py-2 !px-4 !text-[12px]"
                    >
                      {l.label} <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PlaceholderSlot({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 grainy-soft flex flex-col items-center justify-center gap-1.5 text-warm-500/70">
      <div className="w-8 h-8 rounded-full border border-rust-500/30 flex items-center justify-center">
        <Plus size={14} />
      </div>
      <p className="text-[9px] uppercase tracking-[0.14em]">{label}</p>
    </div>
  );
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  if (start === end) return s.toLocaleDateString('en-US', opts).toLowerCase();
  return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', opts)}`.toLowerCase();
}
