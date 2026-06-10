# jacquelinemach.com

Personal portfolio + event showcase for Jacqueline Mach — growth, community & events.

Built with Next.js 15 (App Router) · TypeScript · Tailwind · Framer Motion · a hand-rolled canvas globe (no three.js).

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
npx next dev -p 3002 # or any other port
```

## How the site is laid out

One page (`app/page.tsx`): **Hero** (lanyard badge + bio + stats strip) → **FolderTabs** (the five big folders) → **PageFooter** (contact pill). A site-wide ASCII drift layer (`PageAscii`) floats behind everything below the hero, and `ThemeToggle` (bottom-right) flips dark mode.

| Folder | Component | Data lives in |
|---|---|---|
| 01 map | `components/GlobePreview.tsx` | `data/events.ts` (auto-derived) |
| 02 event recap | `components/EventRecap.tsx` | `data/events.ts` |
| 03 content | `components/ContentBento.tsx` | `CONTENT_ITEMS` array inside the component |
| 04 resume | `components/ResumeFolder.tsx` | `STOPS_RAW` + `QUOTES` arrays inside the component |
| 05 dropdeck | `components/DropdeckFolder.tsx` | `PARTNERS` array inside the component |

## ✦ Adding content (the cheat sheet)

### Add a new event (shows up on the MAP **and** in EVENT RECAP automatically)
1. Drop the flyer into `public/assets/` (name it `flyer_YourEvent.png`).
2. Open `data/events.ts` and copy any `ev({ ... })` block. Fill in:
   - `id` (unique slug), `name`, `location` (`'City, Country'`), `lat`/`lng` (google "city coordinates"),
   - `startDate`/`endDate` (`'YYYY-MM-DD'`), `description`, `stats` (4 punchy numbers),
   - `photos: ['/assets/flyer_YourEvent.png']`, optional `links` (luma), `merch`.
3. Optional but powerful: add `role: ['what I did…', '…']` bullets — they render as a **✦ WHAT I DID** case-study section in the event modal. Do this for your flagship events.

That's it — the globe pin, city list, and flyer strip all derive from this one entry.

### Add content (reels, talks, graphics, tweets → the CONTENT folder)
1. Drop the media into `public/assets/` (video `.mp4` + a `thumb` image, or just an image).
2. Open `components/ContentBento.tsx`, find `CONTENT_ITEMS`, copy an entry of the same kind (`video` / `youtube` / `image` / `graphic` / `tweet`…) and fill in `src`, `thumb`, `title`, `eyebrow`, `size`.

### Add a dropdeck partner
1. Logo → `public/assets/partners/<name>.svg` (or .png).
2. Add to `PARTNERS` in `components/DropdeckFolder.tsx`: `{ name, tagline, logo: '/assets/partners/<name>.svg', href? }`.

### Add a resume role / testimonial
- Roles: `STOPS_RAW` in `components/ResumeFolder.tsx` (sorted newest-first by `sortKey: YYYYMM`).
- Testimonials: `QUOTES` in the same file — the "what they say" section appears as soon as the array has entries.

### Swap evergreen assets
- Profile photo: `public/assets/PFPpng.png` · Resume PDF: `public/resume.pdf` (same filenames).
- Hero bio + "open to work" line: `components/Hero.tsx` · Stats tiles: `components/StatsStrip.tsx`.

## Design system

Theme lives in `app/globals.css` as CSS variables — **light values on `:root`, dark overrides on `html.dark`**.

- Use `rgba(var(--ink-rgb), α)` for text/borders, `rgba(var(--paper-rgb), α)` for surfaces, `rgba(var(--accent-rgb), α)` for interactive accents — these flip automatically in dark mode.
- Keep literal colors only for things that shouldn't flip: modal backdrop scrims, text/chips sitting on photos, the white lanyard badge, the dark flyer cards.
- Folder tints: `.folder-tint-{peach,lavender,rose,ember,mint}` (each has a dark variant).
- Display: Fraunces italic · Body: Inter Tight · Mono: JetBrains Mono.

## Deploy

Vercel, auto-deploys on push to `main`. Custom domain is configured in Vercel → Settings → Domains.

## Notes

- The globe is pure canvas 2D, theme-aware (re-tints pink-on-black in dark mode), drag to spin.
- ASCII drift tokens repel from the cursor (`PageAscii` below the hero, `ASCII_SCATTER` inside `Hero`).
- All motion respects `prefers-reduced-motion`.
- Compress big images before dropping them in (`PFPpng.png` is ~4 MB — export at 1200px WebP when you get a chance).
