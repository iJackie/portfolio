# jacquelinemach.com

Personal portfolio + event showcase for Jacqueline Mach — Head of Community at Infrared Finance.

Built with Next.js 14 (App Router) · TypeScript · Tailwind · Framer Motion · react-globe.gl.

## Run locally

```bash
cd event-showcase
npm install
npm run dev
```

Open <http://localhost:3000>.

## What's in here

| Page | Path | What it does |
|---|---|---|
| Home | `/` | Hero → stats strip → rotating 3D globe with event pins → featured events → about teaser |
| Events | `/events` | Full archive of all events with city filter pills |
| Resume | `/resume` | Styled resume + PDF download |

Keyboard easter egg: press <kbd>/</kbd> anywhere to open a terminal. Try `help`, `ls events`, `cat about`, `open <slug>`.

## Editing content

- **Events:** edit `data/events.ts`. Each event has a slug, coordinates, photos, stats, description, and links. Set `featured: true` to surface it on the homepage.
- **Resume:** edit `app/resume/page.tsx`. Update the `ROLES` and `SKILLS` arrays.
- **Profile photo:** replace `public/assets/PFPpng.png`.
- **PDF resume:** drop a new file at `public/resume.pdf` (same filename).
- **Socials / contact:** edit `components/Footer.tsx`.

## Design system

Single source of truth: `app/globals.css` and `tailwind.config.ts`.

- Primary: rust `#E94B35`
- Surface: cream `#FBF6F1`
- Accent: sage `#7BA68D`
- Anchor: ink `#2B1410`
- Display font: Fraunces (italic) · Body: Inter Tight · Mono: JetBrains Mono

## Deploy to Vercel

1. **Create a GitHub repo** (only the `event-showcase/` folder needs to be tracked):

   ```bash
   cd event-showcase
   git init
   git add .
   git commit -m "init: personal portfolio"
   gh repo create jacqueline-mach-portfolio --public --source=. --push
   ```

   (or use the GitHub web UI to create the repo, then `git remote add origin …` and `git push -u origin main`)

2. **Connect to Vercel:**
   - Go to <https://vercel.com/new>
   - Import the repo you just pushed
   - Framework preset: **Next.js** (auto-detected)
   - Click Deploy — that's it. You'll get a `*.vercel.app` URL.

3. **Custom domain:**
   - In the Vercel project → **Settings → Domains**
   - Add your domain (e.g. `jacquelinemach.com`) and follow the DNS instructions Vercel shows you
   - You'll typically add an A record (`76.76.21.21`) and/or a CNAME (`cname.vercel-dns.com`) at your registrar (Namecheap, GoDaddy, Porkbun, etc.)

4. Every push to `main` auto-deploys.

## Notes

- The globe is rendered client-only (`react-globe.gl` needs `window`); SSR is disabled for that component via `next/dynamic`.
- The custom gradient cursor only renders on devices with a fine pointer (desktop, no touch).
- All motion respects `prefers-reduced-motion`.
- Event flyers in `public/assets/` are originals from the previous build — feel free to compress them further (the largest `PFPpng.png` is 4 MB; consider exporting at 1200px wide JPG/WebP).
# portfolio
