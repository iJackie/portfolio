/**
 * merch.ts — single source of truth for physical merch pieces.
 *
 * Referenced from TWO places:
 *   1. ContentBento (Content tab)   → the MERCH filter chip pulls the full list
 *   2. EventRecap modal             → filters by eventIds to show a "MERCH FROM THIS EVENT" strip
 *
 * To add a merch item:
 *   - Drop the photo in /public/assets/content/merch/<name>.webp
 *   - Append a MerchItem below
 *   - If it was distributed at specific event(s), list their ids in `eventIds`
 *     so the piece auto-shows in those event modals.
 *
 * Merch WITHOUT eventIds is treated as general/brand merch — appears in the
 * Content tab MERCH filter but not in any event modal.
 */

export type MerchCategory = 'apparel' | 'accessory' | 'print' | 'other';

export type MerchItem = {
  id: string;
  name: string;
  photo: string;
  /** Event IDs this merch was distributed at. Empty = general/brand merch. */
  eventIds?: string[];
  category?: MerchCategory;
  year?: string;
  description?: string;
};

export const MERCH: MerchItem[] = [
  {
    id: 'team-merch-1',
    name: 'Team Merch — I',
    photo: '/assets/content/merch/TeamMerch1.webp',
    category: 'apparel',
    year: '2024',
  },
  {
    id: 'team-merch-2',
    name: 'Team Merch — II',
    photo: '/assets/content/merch/TeamMerch2.webp',
    category: 'apparel',
    year: '2024',
  },
  {
    id: 'team-merch-3',
    name: 'Team Merch — III',
    photo: '/assets/content/merch/TeamMerch3.webp',
    category: 'apparel',
    year: '2024',
  },
  {
    id: 'team-merch-4',
    name: 'Team Merch — IV',
    photo: '/assets/content/merch/TeamMerch4.webp',
    category: 'apparel',
    year: '2024',
  },
  {
    id: 'infrared-tote-bag',
    name: 'Infrared Tote Bag',
    photo: '/assets/content/merch/InfraredToteBag.webp',
    category: 'accessory',
    year: '2024',
  },
  // Cross-referenced with events — auto-shows in event modals via eventIds:
  {
    id: 'sicily-offsite-towel',
    name: 'Sicily Offsite Towel',
    photo: '/assets/events/2025-sicily-infrared-offsite/OffsiteTowelMerch.webp',
    eventIds: ['2025-sicily-infrared-offsite'],
    category: 'other',
    year: '2025',
  },
  {
    id: 'sicily-offsite-team-merch',
    name: 'Sicily Offsite Team Merch',
    photo: '/assets/events/2025-sicily-infrared-offsite/TeamMerch.webp',
    eventIds: ['2025-sicily-infrared-offsite'],
    category: 'apparel',
    year: '2025',
  },
  {
    id: 'kbw-shuttle-cup-sleeve',
    name: 'KBW Shuttle Cup Sleeve',
    photo: '/assets/events/2025-seoul-kbw/CafeCupSleeve.webp',
    eventIds: ['2025-seoul-kbw'],
    category: 'other',
    year: '2025',
  },
  {
    id: 'kbw-seoul-merch-drop',
    name: 'KBW Seoul Merch Drop',
    photo: '/assets/events/2025-seoul-kbw/SeoulMerch.webp',
    eventIds: ['2025-seoul-kbw'],
    category: 'apparel',
    year: '2025',
  },
  {
    id: 'akasaka-aura-merch',
    name: 'Akasaka Aura Merch',
    photo: '/assets/events/2025-tokyo-akasaka-aura/AkasakaMerch.webp',
    eventIds: ['2025-tokyo-akasaka-aura'],
    category: 'apparel',
    year: '2025',
  },
  {
    id: 'kimistri-merch-seoul',
    name: 'Kimistri Merch (Beras in Seoul)',
    photo: '/assets/events/2025-seoul-beras/KimistriMerch.webp',
    eventIds: ['2025-seoul-beras'],
    category: 'other',
    year: '2025',
  },
];

/** Return all merch items associated with a given event id. */
export function merchForEvent(eventId: string): MerchItem[] {
  return MERCH.filter((m) => m.eventIds?.includes(eventId));
}
