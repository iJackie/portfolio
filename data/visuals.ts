/**
 * visuals.ts — visual content / graphics catalog.
 *
 * Separate from events so it can showcase educational content, marketing
 * graphics, brand collabs etc. that aren't tied to a single event.
 *
 * To add a piece of work:
 *   1. Drop the thumbnail image into /public/assets/
 *   2. (Optional) Drop a video file into /public/assets/ too
 *   3. Add a new entry to VISUALS below following the VisualItem type
 *
 * Categories so far: 'educational', 'marketing', 'brand', 'design'
 *  - educational  → tutorials, explainers, "how it works" graphics
 *  - marketing    → campaign visuals, ads, partnership graphics
 *  - brand        → identity work, logos, brand kits
 *  - design       → collaborative design with outside designers
 */

export type VisualCategory = 'educational' | 'marketing' | 'brand' | 'design';

export type VisualItem = {
  id: string;
  title: string;
  /** Short caption shown under the title in the card row */
  caption: string;
  category: VisualCategory;
  /** Thumbnail shown on the card (use a path under /public, e.g. '/assets/foo.png') */
  thumbnail: string;
  /** Optional video to show in the right-hand player when this card is active.
   *  Can be an .mp4 file in /public/assets/ or a YouTube/Vimeo embed URL. */
  video?: string;
  /** If `video` is omitted, this poster image fills the right-hand slot */
  poster?: string;
  /** Optional outbound link (e.g., the live post, a Figma file, a tweet) */
  link?: string;
  /** Optional collaborator credit ("with @designer") */
  with?: string;
  /** Date string, freeform (e.g. "Sep 2024") */
  date?: string;
};

/**
 * Sample / placeholder entries.
 * Replace these with your real work as you build the section out.
 * To add one: copy a block, change the fields, point thumbnail at a new
 * file in /public/assets/.
 */
export const VISUALS: VisualItem[] = [
  {
    id: 'infrared-101-explainer',
    title: 'Infrared 101, Proof of Liquidity simplified',
    caption: 'A two-minute animated explainer breaking down how iBERA works.',
    category: 'educational',
    thumbnail: '/assets/Infrared101.png',
    // video: '/assets/visual-reel.mp4',   // ← drop your mp4 here
    poster: '/assets/Infrared101.png',
    with: 'with the Infrared design team',
    date: 'Dec 2024',
  },
  {
    id: 'beracup-poster-series',
    title: 'Beracup poster series',
    caption: 'Identity + flyer system for the Beracup tournaments across Singapore and Bangkok.',
    category: 'design',
    thumbnail: '/assets/BeracupDevcon.png',
    poster: '/assets/BeracupDevcon.png',
    with: 'with @yourdesigner',
    date: 'Sep to Nov 2024',
  },
  {
    id: 'honey-hour-campaign',
    title: 'Honey Hour campaign visuals',
    caption: 'Series of social cards + venue collateral for the Honey Hour event tour.',
    category: 'marketing',
    thumbnail: '/assets/HoneyHour.png',
    poster: '/assets/HoneyHour.png',
    date: '2024 to 2025',
  },
  {
    id: 'bera-spa-identity',
    title: 'Bera Spa identity',
    caption: 'Visual concept for a Devcon-side wellness experience. Soft, editorial, calm.',
    category: 'brand',
    thumbnail: '/assets/BeraSpa1.png',
    poster: '/assets/BeraSpa1.png',
    date: 'Nov 2024',
  },
  {
    id: 'liquid-staking-night-deck',
    title: 'Liquid Staking Night, pitch deck',
    caption: 'Co-hosted deck explaining the three protocols + the through-line of the night.',
    category: 'educational',
    thumbnail: '/assets/LiquidStakingNight.png',
    poster: '/assets/LiquidStakingNight.png',
    date: 'Sep 2024',
  },
  {
    id: 'mrblock-summit-recap',
    title: 'MrBlock Summit recap reel',
    caption: 'Highlights cut from the 2025 MrBlock Summit in Taipei.',
    category: 'marketing',
    thumbnail: '/assets/MrBlock2025.avif',
    // video: '/assets/mrblock-recap.mp4',
    poster: '/assets/MrBlock2025.avif',
    date: 'Sep 2025',
  },
];

export const CATEGORY_LABEL: Record<VisualCategory, string> = {
  educational: 'educational',
  marketing:   'marketing',
  brand:       'brand',
  design:      'design',
};

export const CATEGORY_TONE: Record<VisualCategory, 'rose' | 'sage'> = {
  educational: 'sage',
  marketing:   'rose',
  brand:       'sage',
  design:      'rose',
};
