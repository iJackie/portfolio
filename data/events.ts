/**
 * events.ts — All event data.
 *
 * Ported from the original /assets vanilla version. To add an event, append
 * to the EVENTS array following the EventItem type below.
 *
 * Photo paths assume files live under /public/assets/<name>.{png,jpg,jpeg,avif}.
 * The resolveEventImage helper handles missing extensions.
 */

export type EventStat = { value: string; label: string };
export type EventLink = { label: string; url: string; icon?: string };
export type EventMerch = { name: string; price?: string; icon?: string; link?: string };

export type EventItem = {
  id: string;
  slug: string;
  name: string;
  location: string;
  city: string;
  country: string;
  venue: string;
  lat: number;
  lng: number;
  startDate: string;
  endDate: string;
  emoji: string;
  color: string;
  description: string;
  stats: EventStat[];
  photos: string[];      // primary flyer/photo paths in /public
  merch?: EventMerch[];
  links?: EventLink[];
  featured?: boolean;
  /** CASE-STUDY bullets — "what I did" rendered in the event modal.
   *  Add these to your 2-3 flagship events to turn a recap into a
   *  case study. Be concrete: budget owned, sponsors closed, how it
   *  came together, the result. Example:
   *    role: [
   *      'Produced end-to-end: venue, F&B, run-of-show, staffing',
   *      'Closed 3 co-host partnerships (aPriori, Lorenzo, …)',
   *      'Sold out — 239 RSVPs in 5 days, 40% partner-sourced',
   *    ],
   */
  role?: string[];
};

const ev = (item: Omit<EventItem, 'slug' | 'city' | 'country'>): EventItem => {
  const [city, country] = item.location.split(',').map((s) => s.trim());
  const slug = item.id;
  return { ...item, slug, city, country };
};

export const EVENTS: EventItem[] = [
  ev({
    id: '2024-singapore-liquidstaking',
    name: 'Liquid Staking Night',
    location: 'Singapore, Singapore',
    venue: '',
    lat: 1.3521,
    lng: 103.8198,
    startDate: '2024-09-17',
    endDate: '2024-09-17',
    emoji: '🍸',
    color: '#E94B35',
    description:
      'An evening of drinks and food with three top Liquid Staking protocols across Monad, Berachain, and Babylon, all backed by Binance Labs. Co-hosted with aPriori and Lorenzo Protocol during Token2049 Singapore.',
    stats: [
      { value: '239', label: 'attendees' },
      { value: '3',   label: 'protocols' },
      { value: '1',   label: 'night' },
      { value: '∞',   label: 'vibes' },
    ],
    photos: ['/assets/flyer_LiquidStakingNight.webp'],
    links: [{ label: 'event page', url: 'https://luma.com/u7p1vn54' }],
    featured: true,
  }),

  ev({
    id: '2024-singapore-beracup',
    name: 'Beracup @ Token2049',
    location: 'Singapore, Singapore',
    venue: 'OCBC Arena',
    lat: 1.3048,
    lng: 103.8748,
    startDate: '2024-09-20',
    endDate: '2024-09-20',
    emoji: '🏀',
    color: '#E94B35',
    description:
      'An energetic basketball tournament bringing the Berachain community together during Token2049. 5v5 games, open courts, and exclusive merch drops.',
    stats: [
      { value: '189', label: 'attendees' },
      { value: '3',   label: 'courts' },
      { value: '5v5', label: 'format' },
      { value: '1',   label: 'cup' },
    ],
    photos: ['/assets/flyer_BeracupBasketball.png'],
    links: [{ label: 'event page', url: 'https://lu.ma/3k0ddwwu' }],
    featured: true,
  }),

  ev({
    id: '2024-bangkok-beracup',
    name: 'Beracup @ Devcon',
    location: 'Bangkok, Thailand',
    venue: 'Basketball B Pro',
    lat: 13.7563,
    lng: 100.5018,
    startDate: '2024-11-11',
    endDate: '2024-11-11',
    emoji: '🏀',
    color: '#E94B35',
    description:
      'A high-energy basketball tournament during Devcon with competitive 5v5 games, free play courts, and skill contests featuring Berachain ecosystem prizes.',
    stats: [
      { value: '787', label: 'attendees' },
      { value: '3',   label: 'courts' },
      { value: '5v5', label: 'format' },
      { value: '∞',   label: 'energy' },
    ],
    photos: ['/assets/flyer_BeracupDevcon.webp'],
    links: [{ label: 'event page', url: 'https://lu.ma/beracup' }],
  }),

  ev({
    id: '2024-bangkok-hotpotdao',
    name: 'HotpotDAO, Devcon Thailand',
    location: 'Bangkok, Thailand',
    venue: 'Shoo Loong Kan Hotpot',
    lat: 13.7563,
    lng: 100.5018,
    startDate: '2024-11-12',
    endDate: '2024-11-12',
    emoji: '🍲',
    color: '#E94B35',
    description:
      'A curated Devcon evening bringing founders, capital allocators, and operators together over hotpot, conversation, and networking.',
    stats: [
      { value: '601', label: 'attendees' },
      { value: '10+', label: 'teams' },
      { value: '1',   label: 'night' },
      { value: '🍲',  label: 'hotpot' },
    ],
    photos: ['/assets/flyer_HotpotDao.webp'],
    links: [{ label: 'event page', url: 'https://lu.ma/mmrgk0hj?tk=5VSvY0' }],
    featured: true,
  }),

  ev({
    id: '2024-bangkok-beraspa',
    name: 'Bera Spa \'24',
    location: 'Bangkok, Thailand',
    venue: 'Infinity Wellbeing',
    lat: 13.7563,
    lng: 100.5018,
    startDate: '2024-11-13',
    endDate: '2024-11-13',
    emoji: '💆‍♀️',
    color: '#7BA68D',
    description:
      'A relaxing Devcon-side experience featuring massages, networking, and conversations with Infrared, Exponents, and Zellic.',
    stats: [
      { value: '171',    label: 'attendees' },
      { value: '30 min', label: 'sessions' },
      { value: '3',      label: 'teams' },
      { value: '♨️',     label: 'relaxation' },
    ],
    photos: ['/assets/flyer_BeraSpa1.webp', '/assets/photo_BeraSpa2.webp'],
    links: [{ label: 'event page', url: 'https://lu.ma/8u1lrecl' }],
  }),

  ev({
    id: '2024-bangkok-honeyhour',
    name: 'Honey Hour',
    location: 'Bangkok, Thailand',
    venue: 'Amber Bar BKK',
    lat: 13.7563,
    lng: 100.5018,
    startDate: '2024-11-13',
    endDate: '2024-11-13',
    emoji: '🍯',
    color: '#E94B35',
    description:
      'A relaxed Devcon-side gathering with drinks, networking, and Berachain ecosystem vibes just steps from the conference floor.',
    stats: [
      { value: '363', label: 'attendees' },
      { value: '4',   label: 'projects' },
      { value: '1',   label: 'night' },
      { value: '🍯',  label: 'honey' },
    ],
    photos: ['/assets/flyer_HoneyHour.webp'],
    links: [{ label: 'event page', url: 'https://luma.com/honeyhour?tk=vQ2xxh' }],
  }),

  ev({
    id: '2025-denver-honeyhappyhour',
    name: 'Honey Happy Hour',
    location: 'Denver, United States',
    venue: "Tom's Watch Bar, Coors Field",
    lat: 39.7392,
    lng: -104.9903,
    startDate: '2025-02-25',
    endDate: '2025-02-25',
    emoji: '🍯',
    color: '#E94B35',
    description:
      'A pre-ETH Denver networking event with drinks, games, and a Berachain-focused panel on Proof of Liquidity and ecosystem growth.',
    stats: [
      { value: '470', label: 'attendees' },
      { value: '1',   label: 'panel' },
      { value: '5+',  label: 'projects' },
      { value: '🍹',  label: 'drinks' },
    ],
    photos: ['/assets/flyer_HoneyHappyHour.png'],
    links: [{ label: 'event page', url: 'https://luma.com/pf4uuzzz' }],
  }),

  ev({
    id: '2024-taipei-infrared101',
    name: 'Infrared 101: Unlocking DeFi',
    location: 'Taipei, Taiwan',
    venue: 'Cozy Cowork Cafe',
    lat: 25.0330,
    lng: 121.5654,
    startDate: '2024-12-15',
    endDate: '2024-12-15',
    emoji: '📚',
    color: '#7BA68D',
    description:
      'An educational workshop introducing Infrared Finance and Berachain\'s Proof of Liquidity through talks, games, and interactive learning.',
    stats: [
      { value: '210', label: 'attendees' },
      { value: '1',   label: 'workshop' },
      { value: '🎯',  label: 'learning' },
      { value: '🎁',  label: 'rewards' },
    ],
    photos: [
      '/assets/flyer_Infrared101.png',
      '/assets/infrared101-taipei/merch-table.webp',
      '/assets/infrared101-taipei/bear-standee-banner.webp',
      '/assets/infrared101-taipei/balloons.webp',
    ],
    links: [{ label: 'event page', url: 'https://luma.com/hgp7hvse' }],
  }),

  ev({
    id: '2025-denver-infraredbowl',
    name: "Let's Bowl: Drinks & Networking",
    location: 'Denver, United States',
    venue: 'Lucky Strike Denver',
    lat: 39.7392,
    lng: -104.9903,
    startDate: '2025-02-28',
    endDate: '2025-02-28',
    emoji: '🎳',
    color: '#E94B35',
    description:
      'A bowling and networking event during ETH Denver featuring games, drinks, and community building with Infrared and partners.',
    stats: [
      { value: '338', label: 'attendees' },
      { value: '🎳',  label: 'bowling' },
      { value: '🍻',  label: 'drinks' },
      { value: '🎱',  label: 'games' },
    ],
    photos: ['/assets/flyer_InfraredBowl.jpg'],
    links: [{ label: 'event page', url: 'https://luma.com/k2hytu51' }],
  }),

  ev({
    id: '2025-denver-allin',
    name: 'ALL-INnovation, Founders Soirée',
    location: 'Denver, United States',
    venue: 'Mirus Gallery & Art Bar',
    lat: 39.7392,
    lng: -104.9903,
    startDate: '2025-02-28',
    endDate: '2025-02-28',
    emoji: '♠️',
    color: '#E94B35',
    description:
      'An exclusive founders-only soirée blending networking, games, and nightlife with curated experiences, competitions, and VIP access.',
    stats: [
      { value: '209',  label: 'attendees' },
      { value: 'VIP',  label: 'access' },
      { value: '♠️',   label: 'poker' },
      { value: '🎧',   label: 'afterparty' },
    ],
    photos: ['/assets/flyer_InfraredAllIn.webp', '/assets/flyer_AllinLounge.jpeg'],
    featured: true,
  }),

  ev({
    id: '2024-taipei-mrblock-2024',
    name: 'MrBlock Summit 2024',
    location: 'Taipei, Taiwan',
    venue: 'Syntrend Creative Park',
    lat: 25.0330,
    lng: 121.5654,
    startDate: '2024-12-12',
    endDate: '2024-12-12',
    emoji: '🏛️',
    color: '#E94B35',
    description:
      'A major blockchain summit featuring industry leaders, panels, and project presentations exploring the future of crypto, DeFi, and infrastructure.',
    stats: [
      { value: '1 day', label: 'summit' },
      { value: '20+',   label: 'speakers' },
      { value: 'panels', label: 'content' },
      { value: 'global', label: 'audience' },
    ],
    photos: ['/assets/flyer_MrBlock2024.jpeg'],
    links: [{ label: 'event page', url: 'https://luma.com/mrblock_summit_2024' }],
  }),

  ev({
    id: '2025-taipei-mrblock-2025',
    name: 'MrBlock Summit 2025',
    location: 'Taipei, Taiwan',
    venue: 'Syntrend Creative Park',
    lat: 25.0330,
    lng: 121.5654,
    startDate: '2025-09-05',
    endDate: '2025-09-05',
    emoji: '🚀',
    color: '#E94B35',
    description:
      'The flagship MrBlock summit bringing together top blockchain projects, investors, and communities to explore emerging trends like DeFi 2.0, LRTs, and rollups.',
    stats: [
      { value: '763',    label: 'attendees' },
      { value: 'global', label: 'projects' },
      { value: '1',      label: 'day' },
      { value: '🚀',     label: 'innovation' },
    ],
    photos: ['/assets/flyer_MrBlock2025.avif'],
    links: [{ label: 'event page', url: 'https://luma.com/mrblock_tpe_2025?tk=pgUsiB' }],
    featured: true,
  }),

  ev({
    id: '2025-hongkong-honeyhour',
    name: 'Liquid Honey Hour',
    location: 'Hong Kong, Hong Kong',
    venue: 'AOAO',
    lat: 22.3193,
    lng: 114.1694,
    startDate: '2025-04-09',
    endDate: '2025-04-09',
    emoji: '🍯',
    color: '#E94B35',
    description:
      'A Hong Kong gathering for the Berachain ecosystem with drinks, networking, and conversations with Infrared, Deek Network, and Auros.',
    stats: [
      { value: '201', label: 'attendees' },
      { value: '3',   label: 'projects' },
      { value: '1',   label: 'night' },
      { value: '🍯',  label: 'honey' },
    ],
    photos: ['/assets/flyer_HKHappyHour.png'],
    links: [{ label: 'event page', url: 'https://luma.com/mr5s7z88' }],
  }),

  ev({
    id: '2025-seoul-beras',
    name: 'Beras in Seoul: On-Chain Kimistri',
    location: 'Seoul, South Korea',
    venue: 'Kemistri Seoul',
    lat: 37.5665,
    lng: 126.9780,
    startDate: '2025-04-16',
    endDate: '2025-04-16',
    emoji: '🧪',
    color: '#E94B35',
    description:
      'An invite-only Seoul mixer bringing Berachain builders, founders, and community members together for networking and collaboration.',
    stats: [
      { value: '277',    label: 'attendees' },
      { value: '5',      label: 'partners' },
      { value: 'invite', label: 'only' },
      { value: '🧪',     label: 'chemistry' },
    ],
    photos: ['/assets/flyer_BerasInSeoul.avif'],
    links: [{ label: 'event page', url: 'https://luma.com/sevs1qmx' }],
  }),

  ev({
    id: '2025-dubai-honeyhour',
    name: 'Beras Honey Hour with Magna',
    location: 'Dubai, United Arab Emirates',
    venue: 'Brass Monkey, Bluewaters',
    lat: 25.2048,
    lng: 55.2708,
    startDate: '2025-05-02',
    endDate: '2025-05-02',
    emoji: '🍯',
    color: '#E94B35',
    description:
      'A late-night Token2049 Dubai gathering with networking, drinks, bowling, and discussions around Berachain and Proof of Liquidity.',
    stats: [
      { value: '270', label: 'attendees' },
      { value: '2',   label: 'hosts' },
      { value: '🌙',  label: 'night' },
      { value: '🎳',  label: 'bowling' },
    ],
    photos: ['/assets/flyer_HoneyHourMagna.avif'],
    links: [{ label: 'event page', url: 'https://luma.com/n8rg3ymo' }],
  }),

  ev({
    id: '2025-seoul-kbw',
    name: 'KBW Shuttle by Infrared × Lair',
    location: 'Seoul, South Korea',
    venue: 'Walkerhill Hotels & Resorts',
    lat: 37.5665,
    lng: 126.9780,
    startDate: '2025-09-23',
    endDate: '2025-09-24',
    emoji: '🚌',
    color: '#E94B35',
    description:
      'Official KBW shuttle service connecting key locations across Seoul. Designed to help attendees move seamlessly between events while networking with the community.',
    stats: [
      { value: '894', label: 'riders' },
      { value: '2',   label: 'days' },
      { value: '🚌',  label: 'shuttles' },
      { value: '🎁',  label: 'swag' },
    ],
    photos: [
      '/assets/flyer_KBWShuttle.avif',
      '/assets/SeoulShuttle/Shuttle1.webp',
      '/assets/SeoulShuttle/ShuttleCafe.webp',
      '/assets/SeoulShuttle/SeoulMerch.webp',
      '/assets/SeoulShuttle/CafeCupSleeve.webp',
    ],
    links: [{ label: 'event page', url: 'https://luma.com/38wpurid' }],
    featured: true,
  }),

  ev({
    id: '2025-sicily-infrared-offsite',
    name: 'Infrared Offsite 2025',
    location: 'Cefalù, Italy',
    venue: 'Club Med Cefalù',
    lat: 38.0383,
    lng: 14.0227,
    startDate: '2025-05-18',
    endDate: '2025-05-25',
    emoji: '🌊',
    color: '#7BA68D',
    description:
      'An exclusive Infrared team offsite along the Sicilian coast at Club Med Cefalù. A week of strategy, relaxation, and connection. Ocean views, yoga, and a historic seaside village to explore.',
    stats: [
      { value: '18', label: 'attendees' },
      { value: '7',  label: 'days' },
      { value: '🏝️', label: 'offsite' },
      { value: '🧘', label: 'wellness' },
    ],
    photos: [
      '/assets/Offsite-InfraredCefalu/OffsiteItinerary.webp',
      '/assets/Offsite-InfraredCefalu/Map.webp',
      '/assets/Offsite-InfraredCefalu/View1.webp',
      '/assets/Offsite-InfraredCefalu/View2.webp',
      '/assets/Offsite-InfraredCefalu/View3.webp',
      '/assets/Offsite-InfraredCefalu/InfraredShirt.webp',
      '/assets/Offsite-InfraredCefalu/GroupPic.webp',
    ],
  }),

  ev({
    id: '2025-nyc-edible-nft-food-hunt',
    name: 'Edible NFT Food Hunt',
    location: 'New York, United States',
    venue: 'Partner restaurants across NYC',
    lat: 40.7128,
    lng: -74.0060,
    startDate: '2025-06-17',
    endDate: '2025-06-26',
    emoji: '🍔',
    color: '#FF5A2C',
    description:
      'A Web3 twist on eating during NFT NYC. Diners visit partner restaurants across the city, order curated dishes, collect limited-edition Edible NFTs, and climb a leaderboard for prizes. Built with 8it — the traditional ad-supported restaurant review model is broken; this is what an eat-to-earn version looks like.',
    stats: [
      { value: '12',  label: 'partners' },
      { value: 'NYC', label: 'edition' },
      { value: '10',  label: 'days' },
      { value: '🍽️',  label: 'eat-to-earn' },
    ],
    photos: [
      '/assets/edible-nft/eat-to-earn-header.webp',
      '/assets/edible-nft/exclusive-dish-drops.webp',
      '/assets/edible-nft/howtoplay.webp',
      '/assets/edible-nft/eat-it.webp',
      '/assets/edible-nft/claim-it.webp',
      '/assets/edible-nft/earn-it.webp',
      '/assets/edible-nft/win-it.webp',
      '/assets/edible-nft/partners.webp',
      '/assets/edible-nft/join-8it-fam.webp',
      '/assets/edible-nft/wtfaq.webp',
      '/assets/edible-nft/last-project.webp',
      '/assets/edible-nft/lead-gen-title.webp',
    ],
    links: [
      { label: 'event page', url: 'https://www.8it.world/edible-nft-food-hunt/' },
      { label: 'twitter',    url: 'https://twitter.com/EdibleNft' },
      { label: 'discord',    url: 'https://discord.gg/FBSbjxYMa4' },
      { label: '8it app',    url: 'https://8itapp.page.link/appstore' },
    ],
    featured: true,
  }),

  ev({
    id: '2025-dubai-infravestor-dinner',
    name: 'Infra-vestor Private Dinner',
    location: 'Dubai, United Arab Emirates',
    venue: 'Private venue · Dubai',
    lat: 25.2048,
    lng: 55.2708,
    startDate: '2025-04-30',
    endDate: '2025-04-30',
    emoji: '🔑',
    color: '#3F1F2D',
    description:
      'An invitation-only dinner gathering investors and partners in Dubai — an evening of conversation, connection, and curated cuisine at one of Dubai\'s most iconic spots. Co-hosted by berakana, Raito, Viperr, and Red.',
    stats: [
      { value: '46', label: 'attendees' },
      { value: '4',  label: 'co-hosts' },
      { value: '1',  label: 'night' },
      { value: '🔑', label: 'private' },
    ],
    photos: [
      '/assets/InfraredInvestorDinner/flyer.webp',
    ],
    links: [{ label: 'event page', url: 'https://luma.com/1dp5dlbg' }],
    featured: true,
  }),
];

export const FEATURED_EVENTS = EVENTS.filter((e) => e.featured);

export function getEventBySlug(slug: string): EventItem | undefined {
  return EVENTS.find((e) => e.slug === slug);
}

/** Totals for the StatsStrip */
export const TOTALS = (() => {
  const totalAttendees = EVENTS.reduce((sum, e) => {
    const v = e.stats.find((s) => s.label.toLowerCase().includes('attend') || s.label.toLowerCase().includes('rider'));
    const n = v ? parseInt(v.value.replace(/[^\d]/g, ''), 10) : 0;
    return sum + (isNaN(n) ? 0 : n);
  }, 0);
  const cities = new Set(EVENTS.map((e) => e.city)).size;
  return {
    events: EVENTS.length,
    cities,
    attendees: totalAttendees,
    partners: 30,
    continents: 4,
  };
})();
