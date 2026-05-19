/**
 * reels.ts — vertical-format short videos (9:16).
 *
 * These are the bite-sized clips that live under the globe: event recaps,
 * BTS, content cuts. Separate from `visuals.ts` (longer-form / horizontal /
 * brand work) so the editorial vocabulary stays clean.
 *
 * To add a reel:
 *   1. Drop the .mp4 in /public/assets/  (e.g. honey-hour-recap.mp4)
 *   2. Drop a poster (a still frame, ~720x1280) in /public/assets/ too
 *   3. Add an entry to REELS below
 *
 * If you don't have a poster yet, omit `poster` — we'll fall back to the
 * first frame of the video automatically.
 */

export type Reel = {
  id: string;
  title: string;
  /** e.g. "Bangkok · Nov 2024" */
  caption: string;
  /** path to .mp4 in /public, e.g. '/assets/honey-hour-recap.mp4' */
  video?: string;
  /** path to a still image; fallback when video is missing */
  poster?: string;
  /** Optional outbound link (e.g. the original IG/TikTok post) */
  link?: string;
};

export const REELS: Reel[] = [
  // ── Placeholder slots so the section is visible before you upload mp4s ──
  // Replace each `poster:` with a real screenshot/still from the reel, then
  // add the `video:` line pointing to your mp4 once it's in /public/assets/.
  {
    id: 'reel-honey-hour-bangkok',
    title: 'Honey Hour · Bangkok',
    caption: 'Devcon rooftop · Nov 2024',
    // video: '/assets/honey-hour-bangkok.mp4',
    poster: '/assets/HoneyHour.png',
  },
  {
    id: 'reel-beracup-devcon',
    title: 'Beracup · Devcon',
    caption: 'Basketball B Pro · Bangkok',
    // video: '/assets/beracup-devcon.mp4',
    poster: '/assets/BeracupDevcon.png',
  },
  {
    id: 'reel-bera-spa',
    title: 'Bera Spa',
    caption: 'Devcon wellness · Bangkok',
    // video: '/assets/bera-spa.mp4',
    poster: '/assets/BeraSpa1.png',
  },
  {
    id: 'reel-mrblock-summit',
    title: 'MrBlock Summit',
    caption: 'Taipei · 2025',
    // video: '/assets/mrblock-summit.mp4',
    poster: '/assets/MrBlock2025.avif',
  },
  {
    id: 'reel-honey-happy-hour-denver',
    title: 'Honey Happy Hour',
    caption: 'ETH Denver pre-party',
    // video: '/assets/honey-happy-hour.mp4',
    poster: '/assets/HoneyHappyHour.png',
  },
  {
    id: 'reel-allin-soiree',
    title: 'ALL-INnovation',
    caption: 'Founders soirée · Denver',
    // video: '/assets/allin-soiree.mp4',
    poster: '/assets/AllinLounge.jpeg',
  },
];
