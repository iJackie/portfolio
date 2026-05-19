'use client';

import { motion } from 'framer-motion';
import type { EventItem } from '@/data/events';

type Props = {
  event: EventItem;
  index?: number;
  onClick: (e: EventItem) => void;
};

export default function EventCard({ event, index = 0, onClick }: Props) {
  const cover = event.photos[0];
  return (
    <motion.button
      type="button"
      onClick={() => onClick(event)}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.05, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="group text-left bg-white rounded-2xl overflow-hidden border border-rust-500/10 hover:shadow-[0_18px_42px_-22px_rgba(233,75,53,0.35)] transition-shadow"
    >
      <div className="relative aspect-[16/10] bg-cream-200 overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={event.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full grainy-rust flex items-center justify-center text-4xl">
            {event.emoji}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-rust-500/15 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-sage-700 mb-2">
          <span>{event.city}</span>
          <span className="w-1 h-1 rounded-full bg-rust-300" />
          <span>{formatDate(event.startDate)}</span>
        </div>
        <h3 className="font-sans text-[17px] font-semibold text-ink-900 leading-tight line-clamp-2">
          {event.name}
        </h3>
        <p className="mt-2 text-[13px] text-warm-500 line-clamp-2">
          {event.description}
        </p>
        <div className="mt-4 pt-3 border-t border-rust-500/10 flex items-center justify-between text-[12px]">
          <span className="text-rust-700 font-medium">{event.stats[0]?.value} {event.stats[0]?.label}</span>
          <span className="text-rust-500 group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </div>
    </motion.button>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toLowerCase();
}
