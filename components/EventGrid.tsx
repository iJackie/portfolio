'use client';

import EventCard from './EventCard';
import type { EventItem } from '@/data/events';

type Props = {
  events: EventItem[];
  onSelect: (e: EventItem) => void;
};

export default function EventGrid({ events, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {events.map((e, i) => (
        <EventCard key={e.id} event={e} index={i} onClick={onSelect} />
      ))}
    </div>
  );
}
