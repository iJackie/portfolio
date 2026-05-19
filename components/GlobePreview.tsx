'use client';

/**
 * GlobePreview — pixel-dot canvas globe (port of the original
 * event-showcase GlobeCanvas, slimmed for the lanyard folder body).
 *
 *   - Dense dot grid over a sphere; dots are tinted differently on land vs
 *     water so the continents read clearly even at small sizes. Land mask
 *     comes from /data/worldMap.ts (procedural lat/lng boxes per continent).
 *   - Auto-spins gently. Drag to spin manually. Pauses while a city card
 *     is open.
 *   - Each city in CITIES is projected from real lat/lng and rendered as a
 *     pin with a glow. Front-of-sphere pins are clickable; back-half ones
 *     are z-culled.
 *   - Clicking a pin (or a row in the side list) opens a floating card
 *     anchored to the pin, listing every event in that city. Click an
 *     event row → opens the full EventModal via portal.
 *
 * No three.js, no react-globe.gl — pure canvas 2D plus a tiny lat/lng → 2D
 * projector. Tuned to the lanyard's peach × lavender palette.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { isLand } from '@/data/worldMap';
import { EVENTS as RAW_EVENTS, type EventItem } from '@/data/events';

/* ──────────────────────────────────────────────────────────────────────
   CITY + EVENT DATA — derived from the SHARED /data/events.ts source so
   the globe automatically picks up real flyers, descriptions, stats, and
   luma links. Cities are grouped by city name with averaged lat/lng.
   ────────────────────────────────────────────────────────────────────── */

type City = {
  id: string;          // city slug
  city: string;
  country: string;     // ISO-style code shown on the chip
  lat: number;
  lng: number;
  events: EventItem[]; // full event records, not stubs
  highlight?: string;
};

/* Map full country names → 2-letter codes used on the city chip. */
const COUNTRY_CODE: Record<string, string> = {
  Singapore: 'SG',
  Thailand: 'TH',
  'United States': 'US',
  Taiwan: 'TW',
  'Hong Kong': 'HK',
  'South Korea': 'KR',
  'United Arab Emirates': 'AE',
  Italy: 'IT',
  France: 'FR',
};

/* Optional 1-liner highlight per city. Falls back to "" if not set. */
const CITY_HIGHLIGHT: Record<string, string> = {
  Singapore: 'Token2049 side events',
  Bangkok: 'Devcon anchor week',
  Seoul: 'KBW shuttle + Beras in Seoul',
  Taipei: 'MrBlock Summit · Infrared 101',
  'Hong Kong': 'Liquid Honey Hour',
  Dubai: 'Token2049 Dubai · Brass Monkey',
  Denver: 'ETHDenver lounge + soirée',
  'Cefalù': 'Infrared offsite',
};

/* Build CITIES once from the real events. */
const CITIES: City[] = (() => {
  const map = new Map<string, City>();
  RAW_EVENTS.forEach((ev) => {
    const existing = map.get(ev.city);
    if (existing) {
      existing.events.push(ev);
      // Average lat/lng across events in the same city
      const n = existing.events.length;
      existing.lat = (existing.lat * (n - 1) + ev.lat) / n;
      existing.lng = (existing.lng * (n - 1) + ev.lng) / n;
    } else {
      map.set(ev.city, {
        id: ev.city.toLowerCase().replace(/\s+/g, '-'),
        city: ev.city,
        country: COUNTRY_CODE[ev.country] ?? ev.country.slice(0, 2).toUpperCase(),
        lat: ev.lat,
        lng: ev.lng,
        events: [ev],
        highlight: CITY_HIGHLIGHT[ev.city],
      });
    }
  });
  return Array.from(map.values());
})();


/* ──────────────────────────────────────────────────────────────────────
   PROJECTION
   ────────────────────────────────────────────────────────────────────── */

const STAGE = 480;      // viewport size of the canvas in CSS px
const GLOBE_R = 200;    // sphere radius in canvas units
const CX = STAGE / 2;
const CY = STAGE / 2;

type Dot = { lat: number; lng: number; isLand: boolean };

function project(latDeg: number, lngDeg: number) {
  const lat = (latDeg * Math.PI) / 180;
  const lng = (lngDeg * Math.PI) / 180;
  return {
    x: Math.cos(lat) * Math.sin(lng) * GLOBE_R,
    y: -Math.sin(lat) * GLOBE_R,
    z: Math.cos(lat) * Math.cos(lng),
  };
}

function wrap360(a: number) {
  let n = a % 360;
  if (n < 0) n += 360;
  return n;
}

/** Pre-build the lat/lng dot grid once. */
function buildDotGrid(): Dot[] {
  const out: Dot[] = [];
  // Cover -88..+88 so both poles are represented.
  for (let lat = -88; lat <= 88; lat += 3) {
    const circumference = Math.cos((lat * Math.PI) / 180);
    const steps = Math.max(6, Math.round(120 * circumference));
    for (let s = 0; s < steps; s++) {
      const lng = (s / steps) * 360 - 180;
      out.push({ lat, lng, isLand: isLand(lat, lng) });
    }
  }
  return out;
}

/* ──────────────────────────────────────────────────────────────────────
   COMPONENT
   ────────────────────────────────────────────────────────────────────── */

type ProjectedCity = { city: City; sx: number; sy: number; z: number };

export default function GlobePreview() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Ref to the peek-card popup so we can measure the position of the
  // currently-active event row's anchor dot. That's where the leader
  // line lands.
  const peekRef = useRef<HTMLDivElement | null>(null);
  // Measured leader endpoint in CANVAS svg coordinates. Re-measured
  // whenever the spotlighted city changes OR the active event row
  // changes (cycling within a city's events).
  const [leaderEnd, setLeaderEnd] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startLng: number } | null>(null);
  const stateRef = useRef<{
    lng: number;
    dragging: boolean;
    paused: boolean;
    /** city id currently highlighted on the canvas — kept in a ref so the
        rAF draw loop can read it without restarting on every change. */
    highlightId: string | null;
  }>({ lng: 0, dragging: false, paused: false, highlightId: null });
  // Force a periodic re-render so the side panel + pin overlays follow the
  // canvas spin. Canvas itself is animated in its own rAF loop.
  const [, setTick] = useState(0);
  // MANUAL selection (user clicked a pin/label/list row). Wins over the
  // auto-cycle spotlight.
  const [activeId, setActiveId] = useState<string | null>(null);
  // City the user is currently hovering over (label or list row). Draws
  // a temporary dashed line from the active pin to this one so people
  // can see the connection between cities.
  const [hoverCityId, setHoverCityId] = useState<string | null>(null);
  // AUTO-CYCLE spotlight — rotates through cities every few seconds when
  // the user hasn't picked one manually. The globe keeps spinning the
  // whole time; only the LEFT peek card changes.
  const [spotlightIdx, setSpotlightIdx] = useState(0);
  // EVENT-ROW auto-cycle inside the peek card. Resets to 0 whenever the
  // spotlighted city changes, then cycles through that city's events
  // every ~2.4s. Drives the glowing dot + leader line endpoint.
  const [activeEventIdx, setActiveEventIdx] = useState(0);
  // Modal for an individual event (kept here so the globe is self-contained)
  const [modalEvent, setModalEvent] = useState<EventItem | null>(null);

  const dots = useMemo(() => buildDotGrid(), []);
  // What's "lit up" — manual pick first, then auto-cycle.
  const effectiveCity = activeId
    ? CITIES.find((c) => c.id === activeId) ?? null
    : CITIES[spotlightIdx % CITIES.length] ?? null;
  const activeCity = effectiveCity;

  // Auto-cycle the spotlight — keep going regardless of globe spin.
  // Pauses ONLY when a modal is open (so the visitor can read) or
  // while the visitor is actively dragging the globe.
  useEffect(() => {
    if (modalEvent) return;
    // Slow enough that visitors can actually read the peek card and
    // scan the city list before it moves on.
    const id = setInterval(() => {
      setSpotlightIdx((i) => (i + 1) % CITIES.length);
    }, 7000);
    return () => clearInterval(id);
  }, [modalEvent]);

  // EVENT-ROW auto-cycle inside the peek card. Whenever the spotlighted
  // city changes (auto-tour OR manual click), reset to row 0 and start
  // cycling through that city's events every ~2.4s. This drives the
  // glowing dot beside each row AND the leader-line endpoint, so the
  // line redraws to the active row each cycle.
  useEffect(() => {
    setActiveEventIdx(0);
  }, [activeId, spotlightIdx]);

  useEffect(() => {
    if (modalEvent) return;
    const city = activeId
      ? CITIES.find((c) => c.id === activeId)
      : CITIES[spotlightIdx % CITIES.length];
    if (!city || city.events.length <= 1) return;
    const id = setInterval(() => {
      setActiveEventIdx((i) => (i + 1) % city.events.length);
    }, 2400);
    return () => clearInterval(id);
  }, [modalEvent, activeId, spotlightIdx]);

  // MEASURE the active CITY-LIST ROW's anchor dot every frame so the
  // dotted leader line tracks the row PERFECTLY while it eases into
  // view via auto-scroll. The previous version measured at a few
  // discrete timestamps (0/120/260/420ms) and the line landed at the
  // OLD position while the row was still mid-scroll → visible mismatch.
  //
  // Now: we run a rAF loop that updates `leaderEnd` every frame until:
  //   (a) the row's position hasn't changed for 150ms (settled), AND
  //   (b) at least 1.2s has elapsed (safety floor for slow scrolls),
  // or 4s total (watchdog). Cheap enough to run continuously — we
  // already do per-frame work for the globe canvas.
  useEffect(() => {
    if (!effectiveCity) {
      setLeaderEnd(null);
      return;
    }
    let raf = 0;
    let startTs = 0;
    let lastChangeTs = 0;
    let lastX = NaN;
    let lastY = NaN;

    const tick = (ts: number) => {
      if (!startTs) startTs = ts;
      const canvas = canvasRef.current;
      if (!canvas) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const dotEl = document.querySelector<HTMLElement>('[data-leader-anchor="true"]');
      if (!dotEl) {
        setLeaderEnd(null);
        raf = requestAnimationFrame(tick);
        return;
      }
      const cRect = canvas.getBoundingClientRect();
      const dRect = dotEl.getBoundingClientRect();
      const scale = STAGE / (cRect.width || 1);
      const x = (dRect.left + dRect.width / 2 - cRect.left) * scale;
      const y = (dRect.top + dRect.height / 2 - cRect.top) * scale;
      // Update state only if it moved enough to be visible (>0.5 unit).
      if (Math.abs(x - lastX) > 0.5 || Math.abs(y - lastY) > 0.5) {
        setLeaderEnd({ x, y });
        lastX = x;
        lastY = y;
        lastChangeTs = ts;
      }
      const elapsed = ts - startTs;
      const sinceChange = ts - lastChangeTs;
      // Stop the loop when the row has settled (no movement for 150ms
      // AND at least 1.2s elapsed) OR after the 4s watchdog.
      const settled = sinceChange > 150 && elapsed > 1200;
      const expired = elapsed > 4000;
      if (settled || expired) return;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    // Page-level scroll / resize → re-run the tracking loop (one-shot
    // measure + a few trailing frames, in case the row re-positioned).
    const onPageMove = () => {
      cancelAnimationFrame(raf);
      startTs = 0;
      lastChangeTs = 0;
      lastX = NaN;
      lastY = NaN;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('resize', onPageMove);
    window.addEventListener('scroll', onPageMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onPageMove);
      window.removeEventListener('scroll', onPageMove);
    };
  }, [effectiveCity?.id]);

  // The globe NEVER stops spinning anymore — even when a peek card is open.
  // (The visitor specifically asked the globe to keep moving.)
  useEffect(() => {
    stateRef.current.paused = false;
  }, []);

  // Mirror the currently-spotlighted city id into the rAF state so the
  // canvas draw loop can highlight the right pin every frame.
  useEffect(() => {
    stateRef.current.highlightId = effectiveCity?.id ?? null;
  }, [effectiveCity?.id]);

  // (Leader-line measurement effect removed — the dashed flight trail
  // and its DOM-anchor measurement code are gone now.)

  // Main draw loop. Uses devicePixelRatio for crisp dots on retina.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = STAGE * dpr;
    canvas.height = STAGE * dpr;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf = 0;
    let lastT = performance.now();
    let lastTick = 0;

    const draw = (t: number) => {
      const dt = Math.min(0.05, (t - lastT) / 1000);
      lastT = t;

      let lng = stateRef.current.lng;
      if (!stateRef.current.dragging) {
        const AMBIENT = stateRef.current.paused ? 2 : 7;
        lng = wrap360(lng + AMBIENT * dt);
      }
      stateRef.current.lng = lng;

      ctx.clearRect(0, 0, STAGE, STAGE);

      // Soft halo behind the sphere
      const halo = ctx.createRadialGradient(CX, CY, GLOBE_R, CX, CY, GLOBE_R + 28);
      halo.addColorStop(0, 'rgba(255,138,92,0)');
      halo.addColorStop(0.55, 'rgba(244,168,193,0.35)');
      halo.addColorStop(1, 'rgba(244,168,193,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(CX, CY, GLOBE_R + 28, 0, Math.PI * 2);
      ctx.fill();

      // Sphere base — peach-cream gradient with off-center light source
      const sphereGrad = ctx.createRadialGradient(
        CX - GLOBE_R * 0.3, CY - GLOBE_R * 0.3, GLOBE_R * 0.15,
        CX, CY, GLOBE_R,
      );
      sphereGrad.addColorStop(0, 'rgba(255,244,238,0.85)');
      sphereGrad.addColorStop(0.65, 'rgba(253,230,233,0.55)');
      sphereGrad.addColorStop(1, 'rgba(236,218,242,0.35)');
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(CX, CY, GLOBE_R, 0, Math.PI * 2);
      ctx.fill();

      // Water dots — small, faint lavender
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        if (d.isLand) continue;
        const p = project(d.lat, d.lng + lng);
        if (p.z < -0.02) continue;
        const depthFade = 0.35 + p.z * 0.65;
        ctx.fillStyle = `rgba(192,168,210,${0.28 * depthFade})`;
        ctx.fillRect(CX + p.x - 0.5, CY + p.y - 0.5, 1.2, 1.2);
      }

      // Land dots — bigger, rose-saturated so continents pop
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        if (!d.isLand) continue;
        const p = project(d.lat, d.lng + lng);
        if (p.z < -0.02) continue;
        const depthFade = 0.45 + p.z * 0.55;
        ctx.fillStyle = `rgba(212,92,139,${0.88 * depthFade})`;
        ctx.fillRect(CX + p.x - 1.3, CY + p.y - 1.3, 2.6, 2.6);
      }

      // Pins — every visible pin breathes with a subtle ring so the
      // globe feels alive and clickable. Active pin gets a bigger
      // ring + a brighter glow + a larger core.
      const pulseT = (t / 1000) % 1.6 / 1.6;
      // Secondary slow pulse (different phase) so inactive pins don't
      // all flash in sync — adds organic life.
      const slowT = (t / 1400) % 1;
      CITIES.forEach((c, idx) => {
        const p = project(c.lat, c.lng + lng);
        if (p.z < 0.08) return;
        const cx = CX + p.x;
        const cy = CY + p.y;
        const depthFade = 0.55 + p.z * 0.45;
        const isActive = c.id === stateRef.current.highlightId;
        // Stagger each pin's pulse phase a little so they breathe
        // independently — much more "alive" than a synchronized blink.
        const localPhase = (slowT + idx * 0.11) % 1;

        if (isActive) {
          // BIG outer pulsing ring
          const ringR = 9 + pulseT * 30;
          ctx.strokeStyle = `rgba(255,90,44,${0.88 * (1 - pulseT)})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
          ctx.stroke();

          // Bright halo glow
          const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
          glow.addColorStop(0, `rgba(255,90,44,${1.0 * depthFade})`);
          glow.addColorStop(0.5, `rgba(255,138,92,${0.5 * depthFade})`);
          glow.addColorStop(1, 'rgba(255,138,92,0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(cx, cy, 22, 0, Math.PI * 2);
          ctx.fill();

          // Big ember core
          ctx.fillStyle = `rgba(255,90,44,${depthFade})`;
          ctx.beginPath();
          ctx.arc(cx, cy, 4.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(255,255,255,${0.95 * depthFade})`;
          ctx.beginPath();
          ctx.arc(cx, cy, 1.6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Subtle breathing ring on EVERY visible pin (staggered phase)
          const breathR = 6 + localPhase * 14;
          const breathAlpha = 0.55 * (1 - localPhase) * depthFade;
          ctx.strokeStyle = `rgba(255,90,44,${breathAlpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy, breathR, 0, Math.PI * 2);
          ctx.stroke();

          // Stronger inactive glow than before so pins read clearly
          const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
          glow.addColorStop(0, `rgba(255,90,44,${0.85 * depthFade})`);
          glow.addColorStop(0.55, `rgba(255,138,92,${0.32 * depthFade})`);
          glow.addColorStop(1, 'rgba(255,138,92,0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(cx, cy, 14, 0, Math.PI * 2);
          ctx.fill();

          // Slightly bigger core dot
          ctx.fillStyle = `rgba(255,90,44,${0.95 * depthFade})`;
          ctx.beginPath();
          ctx.arc(cx, cy, 3.0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(255,255,255,${0.95 * depthFade})`;
          ctx.beginPath();
          ctx.arc(cx, cy, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Edge ring
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(CX, CY, GLOBE_R, 0, Math.PI * 2);
      ctx.stroke();

      // Tick the React tree ~12 times per second so the absolutely-positioned
      // city card overlay follows the spinning pin.
      if (t - lastTick > 80) {
        lastTick = t;
        setTick((n) => (n + 1) % 1000000);
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [dots, activeId]);

  // Project ALL cities for the overlay + side panel using current lng.
  // This is computed on every render (~12fps) so card pos tracks the spin.
  const projectedCities: ProjectedCity[] = CITIES.map((city) => {
    const p = project(city.lat, city.lng + stateRef.current.lng);
    return { city, sx: CX + p.x, sy: CY + p.y, z: p.z };
  });

  // The peek card is now pinned to the LEFT side of the globe (not to
  // the pin), so it doesn't need to close when the pin rotates away.
  // The card just stays put while the globe keeps turning. The
  // `activeProjected` value is still useful for highlighting the pin's
  // glow on the canvas.
  const activeProjected = activeCity
    ? projectedCities.find((p) => p.city.id === activeCity.id) ?? null
    : null;

  // Translate a click on the canvas into a city hit-test.
  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (stateRef.current.dragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = STAGE / rect.width;
    const mx = (e.clientX - rect.left) * scale;
    const my = (e.clientY - rect.top) * scale;
    // Find closest visible pin within hit radius
    let best: { id: string; dist: number } | null = null;
    projectedCities.forEach((p) => {
      if (p.z < 0.08) return;
      const d = Math.hypot(mx - p.sx, my - p.sy);
      if (d < 16 && (!best || d < best.dist)) best = { id: p.city.id, dist: d };
    });
    if (best) {
      // TS doesn't narrow inside this closure — assert via local variable
      const id = (best as { id: string }).id;
      setActiveId((prev) => (prev === id ? null : id));
    } else {
      setActiveId(null);
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Eyebrow */}
      <p
        className="font-mono text-[10px] tracking-[0.3em] mb-3 uppercase"
        style={{ color: 'rgba(255,90,44,0.85)' }}
      >
        ✦ DRAG TO SPIN · CLICK A PIN OR A CITY
      </p>

      {/* TWO-COLUMN layout inside the folder:
            - LEFT: BIG globe (takes ~half the folder)
            - RIGHT: city list (bigger now to showcase events)
          The peek card has been MOVED OUT of the grid entirely — it
          renders as an absolutely-positioned popup that sticks ~70%
          OUTSIDE the folder's left edge. */}
      <div className="relative w-full grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-6 md:gap-10 items-start">
        {/* POPPED-OUT PEEK CARD — anchored to the LEFT edge of this
            grid and pulled 70% of its own width OFF-screen, so most of
            the card hangs over the folder's left edge into the page
            gutter. Dotted leader line on the right connects it back
            to the active pin on the globe. */}
        {/* OUTER positioner — handles the 75/25 split (translateX -75%).
            Wrapped around the motion.div so framer-motion can drive its
            OWN transform (x/scale/rotate) on the inner element without
            clobbering the outer translate.  */}
        <div
          ref={peekRef}
          className="hidden md:block absolute z-30 pointer-events-none"
          style={{
            top: '6%',
            left: 0,
            transform: 'translateX(-75%)',
            width: 'clamp(220px, 20vw, 260px)',
          }}
        >
        {/* mode="popLayout" → the OLD card and the NEW card overlap during
            the swap, so the highlight on the canvas and the visible peek
            card stay in sync. mode="wait" caused a ~450ms drift where the
            canvas was already on the next city while the popup was still
            exiting the previous one. */}
        <AnimatePresence mode="popLayout">
          {effectiveCity && (
            <motion.div
              key={`peek-${effectiveCity.id}`}
              initial={{ opacity: 0, x: -24, scale: 0.94, rotate: -3 }}
              animate={{ opacity: 1, x: 0, scale: 1, rotate: -1.5 }}
              exit={{ opacity: 0, x: -16, scale: 0.95, rotate: -2 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto"
              style={{
                filter:
                  'drop-shadow(0 16px 28px rgba(63,31,45,0.32)) drop-shadow(0 4px 10px rgba(63,31,45,0.18))',
              }}
            >
              {!activeId && (
                <p
                  className="font-mono text-[9px] tracking-[0.22em] uppercase mb-1.5 ml-1"
                  style={{ color: 'rgba(255,90,44,0.85)' }}
                >
                  ✦ now visiting · auto-tour
                </p>
              )}
              <CityCard
                city={effectiveCity}
                onPickEvent={(ev) => setModalEvent(ev)}
                activeEventIdx={activeEventIdx % effectiveCity.events.length}
              />
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* LEFT — BIG GLOBE, front and center of the folder */}
        <div
          className="relative mx-auto"
          style={{
            width: '100%',
            // Slightly bigger globe — fills its half of the folder.
            maxWidth: 560,
            aspectRatio: '1 / 1',
          }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full touch-none select-none"
            style={{ cursor: 'grab' }}
            onPointerDown={(e) => {
              (e.target as Element).setPointerCapture?.(e.pointerId);
              dragRef.current = { startX: e.clientX, startLng: stateRef.current.lng };
              stateRef.current.dragging = true;
              (e.currentTarget as HTMLCanvasElement).style.cursor = 'grabbing';
            }}
            onPointerMove={(e) => {
              const start = dragRef.current;
              // If dragging, advance the rotation.
              if (start && stateRef.current.dragging) {
                const w = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect().width || 1;
                const dxDeg = ((e.clientX - start.startX) / w) * 360;
                stateRef.current.lng = wrap360(start.startLng + dxDeg);
                return;
              }
              // Otherwise: hover-detect the nearest visible pin so we can
              // draw the dotted line from active → hovered pin.
              const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
              const scale = STAGE / (rect.width || 1);
              const mx = (e.clientX - rect.left) * scale;
              const my = (e.clientY - rect.top) * scale;
              let best: { id: string; dist: number } | null = null;
              projectedCities.forEach((p) => {
                if (p.z < 0.08) return;
                const d = Math.hypot(mx - p.sx, my - p.sy);
                if (d < 18 && (!best || d < best.dist)) best = { id: p.city.id, dist: d };
              });
              const nextId = best ? (best as { id: string }).id : null;
              setHoverCityId((prev) => (prev === nextId ? prev : nextId));
            }}
            onPointerLeave={() => setHoverCityId(null)}
            onPointerUp={(e) => {
              const wasDragging = Math.abs((e.clientX - (dragRef.current?.startX ?? e.clientX))) > 4;
              stateRef.current.dragging = false;
              dragRef.current = null;
              (e.currentTarget as HTMLCanvasElement).style.cursor = 'grab';
              // Only fire the click if the user didn't drag
              if (!wasDragging) onCanvasClick(e);
            }}
            onPointerCancel={(e) => {
              stateRef.current.dragging = false;
              dragRef.current = null;
              (e.currentTarget as HTMLCanvasElement).style.cursor = 'grab';
              setHoverCityId(null);
            }}
          />

          {/* PIN LABELS + LEADER LINES — overlay every visible city with a
              small floating label so people see "events are here." Each
              label fans out from the pin via a dashed leader line. The
              active pin gets a BIG flight-path leader that arcs OUT to
              the peek card on the left — drawing attention to the event. */}
          <svg
            // SVG canvas extends to the RIGHT past the globe so the
            // leader line can reach the active city-list row. ViewBox
            // starts at 0 (canvas left edge) and is wider so coords
            // past the globe are still drawable.
            viewBox={`0 0 ${STAGE * 2.2} ${STAGE}`}
            className="absolute pointer-events-none"
            style={{
              top: 0,
              left: 0,
              width: `${STAGE * 2.2}px`,
              height: '100%',
              overflow: 'visible',
              // z-index 35 keeps the line above the city list cards.
              zIndex: 35,
            }}
            preserveAspectRatio="none"
            aria-hidden
          >
            {/* Per-pin short leaders connecting each visible pin to its
                label. The ACTIVE pin gets a stronger ember-colored
                dashed line so the "two glowing lights" (pin + label)
                visibly connect. */}
            {projectedCities.map((p) => {
              if (p.z < 0.1) return null;
              const isActive = p.city.id === effectiveCity?.id;
              const onLeftSide = p.sx > STAGE / 2;
              const labelX = onLeftSide ? p.sx - 28 : p.sx + 28;
              const labelY = p.sy;
              return (
                <g key={`leader-${p.city.id}`} opacity={0.55 + p.z * 0.45}>
                  <line
                    x1={p.sx}
                    y1={p.sy}
                    x2={labelX}
                    y2={labelY}
                    stroke={
                      isActive
                        ? 'rgba(255,90,44,0.85)'
                        : 'rgba(212,92,139,0.5)'
                    }
                    strokeWidth={isActive ? 1.4 : 0.8}
                    // Dotted style for the active leader (matches the
                    // auto-tour + hover lines), tiny dashes for inactive.
                    strokeDasharray={isActive ? '0 5' : '2 3'}
                    strokeLinecap="round"
                    className={isActive ? 'globe-active-leader' : undefined}
                  />
                </g>
              );
            })}

            {/* AUTO-TOUR LEADER — thin DOTTED line from the active pin
                to the spotlit city's row in the right-side city list.
                The endpoint (`leaderEnd`) is measured live from the
                row's ember anchor dot, so the line always lands
                perfectly on the row as the auto-tour cycles cities. */}
            {(() => {
              const active = projectedCities.find(
                (p) => p.city.id === effectiveCity?.id && p.z > 0.05,
              );
              if (!active || !leaderEnd) return null;
              const startX = active.sx;
              const startY = active.sy;
              const endX = leaderEnd.x;
              const endY = leaderEnd.y;
              // Gentle arc — pulled up slightly so the dotted trail
              // reads as a soft curve, not a straight ruler.
              const ctrlX = (startX + endX) / 2;
              const ctrlY = Math.min(startY, endY) - 40;
              return (
                <g key={`row-leader-${effectiveCity?.id}`}>
                  {/* Larger ember dot at the pin end so the trail
                      visibly connects into the glowing pin. */}
                  <circle cx={startX} cy={startY} r={4} fill="var(--ember-500)" />
                  <circle cx={startX} cy={startY} r={1.5} fill="#fdf9f2" />
                  {/* DOTTED line — bigger dots (3px), tighter spacing
                      (10px apart) so the trail reads as a clear
                      connector from pin → row. */}
                  <path
                    d={`M ${startX} ${startY} Q ${ctrlX} ${ctrlY}, ${endX} ${endY}`}
                    fill="none"
                    stroke="rgba(255,90,44,0.9)"
                    strokeWidth="3"
                    strokeDasharray="0 10"
                    strokeLinecap="round"
                    className="globe-active-leader"
                  />
                  {/* Big ember terminator at the row end — the trail
                      lands on top of the row's own anchor dot so the
                      two visibly fuse into one glowing point. */}
                  <circle cx={endX} cy={endY} r={5} fill="var(--ember-500)" />
                  <circle cx={endX} cy={endY} r={2} fill="#fdf9f2" />
                </g>
              );
            })()}

            {/* HOVER BRIDGE — dashed leader between the ACTIVE pin and
                whatever city the user is currently hovering over (label
                or city-list row). Only draws when both pins are
                actually visible on the front of the globe. */}
            {(() => {
              if (!hoverCityId || hoverCityId === effectiveCity?.id) return null;
              const from = projectedCities.find(
                (p) => p.city.id === effectiveCity?.id && p.z > 0.05,
              );
              const to = projectedCities.find(
                (p) => p.city.id === hoverCityId && p.z > 0.05,
              );
              if (!from || !to) return null;
              // Bow the line slightly so it arcs between the two pins
              // instead of being a flat ruler.
              const midX = (from.sx + to.sx) / 2;
              const midY = (from.sy + to.sy) / 2 - 40;
              return (
                <g key={`hover-bridge-${hoverCityId}`}>
                  {/* Thin DOTTED bridge — matches the auto-tour leader
                      style (perfect round dots, ~6px apart). No halo,
                      no chunky stroke. */}
                  <path
                    d={`M ${from.sx} ${from.sy} Q ${midX} ${midY}, ${to.sx} ${to.sy}`}
                    fill="none"
                    stroke="rgba(255,90,44,0.7)"
                    strokeWidth="1.6"
                    strokeDasharray="0 6"
                    strokeLinecap="round"
                    className="globe-active-leader"
                  />
                  {/* Small ember terminator at the hover end so the
                      line clearly pins onto the target pin. */}
                  <circle cx={to.sx} cy={to.sy} r={3} fill="var(--ember-500)" />
                </g>
              );
            })()}
          </svg>
          <style jsx>{`
            :global(.globe-active-leader) {
              animation: globeActiveLeaderFlow 2.2s linear infinite;
            }
            @keyframes globeActiveLeaderFlow {
              from { stroke-dashoffset: 0; }
              to   { stroke-dashoffset: -20; }
            }
            @media (prefers-reduced-motion: reduce) {
              :global(.globe-active-leader) { animation: none; }
            }
          `}</style>

          {/* HTML label tags — separate layer because we want real text
              with the project's font, not SVG <text>. Each label is
              positioned via percent so it tracks the spinning pin. */}
          {projectedCities.map((p) => {
            if (p.z < 0.1) return null;
            const isActive = p.city.id === effectiveCity?.id;
            const onLeftSide = p.sx > STAGE / 2;
            const opacity = 0.55 + p.z * 0.45;
            return (
              <button
                key={`label-${p.city.id}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveId((prev) => (prev === p.city.id ? null : p.city.id));
                }}
                onMouseEnter={() => setHoverCityId(p.city.id)}
                onMouseLeave={() => setHoverCityId(null)}
                className="absolute z-10 transition-transform"
                style={{
                  left: `${(p.sx / STAGE) * 100}%`,
                  top: `${(p.sy / STAGE) * 100}%`,
                  transform: `translate(${onLeftSide ? '-100%' : '0%'}, -50%) translate(${onLeftSide ? '-30px' : '30px'}, 0)`,
                  opacity,
                }}
              >
                <div
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full whitespace-nowrap transition-all"
                  style={{
                    background: isActive ? '#3F1F2D' : 'rgba(253,249,242,0.92)',
                    color: isActive ? '#fdf9f2' : 'rgba(63,31,45,0.85)',
                    border: `1px solid ${isActive ? 'rgba(255,90,44,0.6)' : 'rgba(63,31,45,0.18)'}`,
                    boxShadow: isActive
                      ? '0 6px 18px -8px rgba(255,90,44,0.55)'
                      : '0 4px 12px -8px rgba(63,31,45,0.35)',
                    transform: isActive ? 'scale(1.06)' : 'scale(1)',
                  }}
                >
                  <span
                    className="font-mono text-[9px] tracking-[0.18em] uppercase"
                    style={{
                      color: isActive ? 'var(--ember-400)' : 'rgba(255,90,44,0.85)',
                    }}
                  >
                    {p.city.events.length}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.05em] lowercase">
                    {p.city.city}
                  </span>
                </div>
              </button>
            );
          })}

          {/* The peek card has been moved OUT of the canvas wrapper and
              now lives in its own dedicated column (COLUMN 1) to the
              left of the globe — so the sphere stays unobstructed. */}
        </div>

        {/* CITY LIST — scrolls within itself, doesn't push page */}
        <CityList
          cities={CITIES}
          activeId={activeId}
          spotlightId={effectiveCity?.id ?? null}
          onPickCity={(id) => setActiveId((prev) => (prev === id ? null : id))}
          onHoverCity={setHoverCityId}
        />
      </div>

      {/* Footer — no event/city count, just a soft hint */}
      <p
        className="mt-5 font-mono text-[10px] tracking-[0.22em] uppercase text-center"
        style={{ color: 'rgba(63,31,45,0.5)' }}
      >
        ✦ scroll the cities · click a pin · drag to spin
      </p>

      {/* Event detail modal — portaled so it escapes the tabs panel */}
      <EventDetailModal
        event={modalEvent}
        onClose={() => setModalEvent(null)}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   City card — floats next to the active pin
   ────────────────────────────────────────────────────────────────────── */
function CityCard({
  city,
  onPickEvent,
  activeEventIdx,
}: {
  city: City;
  onPickEvent: (e: EventItem) => void;
  /** Which event row is currently the "leader anchor" — drives the
   *  glowing ember dot + the parent's SVG leader endpoint. */
  activeEventIdx: number;
}) {
  return (
    <div
      className="rounded-[10px] px-4 py-3 min-w-[220px] max-w-[280px]"
      style={{
        background: 'rgba(253,249,242,0.96)',
        border: '1px solid rgba(63,31,45,0.18)',
        boxShadow:
          'inset 0 1px 0 rgba(255,255,255,0.7), 0 12px 28px -16px rgba(63,31,45,0.45)',
      }}
    >
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <span
          className="font-mono text-[9px] tracking-[0.22em] uppercase"
          style={{ color: 'rgba(255,90,44,0.85)' }}
        >
          {city.country}
        </span>
        <span
          className="font-mono text-[9px] tracking-[0.18em] uppercase"
          style={{ color: 'rgba(63,31,45,0.45)' }}
        >
          {city.events.length} event{city.events.length > 1 ? 's' : ''}
        </span>
      </div>
      <h4
        className="font-display italic leading-tight mb-2"
        style={{ color: '#3F1F2D', fontSize: 22 }}
      >
        {city.city}
      </h4>
      {city.highlight && (
        <p
          className="font-sans text-[12px] leading-snug mb-3"
          style={{ color: 'rgba(63,31,45,0.75)' }}
        >
          {city.highlight}
        </p>
      )}
      <ul className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto">
        {city.events.map((ev, i) => {
          const year = new Date(ev.startDate).getFullYear();
          const flyer = ev.photos[0];
          // The currently-cycled event row becomes the leader anchor.
          // The dot carries `data-leader-anchor="true"` so the parent's
          // measurement effect can grab its position for the leader line.
          const isLeaderAnchor = i === activeEventIdx;
          return (
            <li key={ev.id}>
              <button
                type="button"
                onClick={() => onPickEvent(ev)}
                className="w-full text-left flex items-center gap-2 px-1.5 py-1.5 rounded-md transition-all hover:bg-white/70"
                style={{
                  border: `1px solid ${isLeaderAnchor ? 'rgba(255,90,44,0.4)' : 'rgba(63,31,45,0.1)'}`,
                  background: isLeaderAnchor
                    ? 'rgba(255,90,44,0.07)'
                    : 'transparent',
                  boxShadow: isLeaderAnchor
                    ? '0 4px 12px -8px rgba(255,90,44,0.35)'
                    : 'none',
                }}
              >
                {/* Tiny flyer thumb */}
                <div
                  className="relative shrink-0 w-9 h-9 rounded overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(63,31,45,0.12)',
                  }}
                >
                  {flyer ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={flyer} alt={ev.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-base" aria-hidden>
                      {ev.emoji}
                    </span>
                  )}
                </div>
                <span
                  className="flex-1 font-sans text-[12px] leading-tight truncate"
                  style={{ color: 'rgba(63,31,45,0.9)' }}
                >
                  {ev.name}
                </span>
                <span
                  className="font-mono text-[9px] tracking-[0.18em] shrink-0"
                  style={{ color: 'rgba(255,90,44,0.75)' }}
                >
                  {year}
                </span>
                {/* Middle dot — purely visual now (leader line moved to
                    the city-list rail on the right). Active row's dot
                    still glows ember to mark which event is being
                    spotlighted by the auto-cycle. */}
                <span
                  className="shrink-0 inline-block rounded-full transition-all"
                  style={{
                    width: isLeaderAnchor ? 9 : 7,
                    height: isLeaderAnchor ? 9 : 7,
                    marginLeft: 4,
                    background: isLeaderAnchor
                      ? 'var(--ember-500)'
                      : 'rgba(212,92,139,0.55)',
                    boxShadow: isLeaderAnchor
                      ? '0 0 0 3px rgba(255,90,44,0.25), 0 0 12px rgba(255,90,44,0.5)'
                      : 'none',
                  }}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   City list — sits next to the globe; clicking jumps the globe to a city
   ────────────────────────────────────────────────────────────────────── */
function CityList({
  cities,
  activeId,
  spotlightId,
  onPickCity,
  onHoverCity,
}: {
  cities: City[];
  activeId: string | null;
  /** The currently-spotlighted city (manual OR auto-tour). Used to
   *  auto-scroll the active row into view. */
  spotlightId: string | null;
  onPickCity: (id: string) => void;
  /** Fired when the user hovers a row in or out, so the globe can draw
   *  a temporary dashed line between active + hovered city. */
  onHoverCity: (id: string | null) => void;
}) {
  const scrollerRef = useRef<HTMLUListElement | null>(null);
  const rowRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  // Stop auto-scrolling once the visitor scrolls / interacts manually.
  const [userTookOver, setUserTookOver] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const stop = () => setUserTookOver(true);
    el.addEventListener('wheel', stop, { passive: true, once: true });
    el.addEventListener('touchstart', stop, { passive: true, once: true });
    return () => {
      el.removeEventListener('wheel', stop);
      el.removeEventListener('touchstart', stop);
    };
  }, []);

  // Randomized per visit — Fisher-Yates shuffle, memoized so the order
  // stays stable across renders within a single page load but feels
  // fresh on every reload.
  const sorted = useMemo(() => {
    const arr = [...cities];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [cities]);

  // Gentle auto-scroll: keep the spotlighted row visible. Stops once the
  // user has interacted with the list themselves.
  useEffect(() => {
    if (userTookOver || !spotlightId) return;
    const row = rowRefs.current.get(spotlightId);
    const scroller = scrollerRef.current;
    if (!row || !scroller) return;
    const rowTop = row.offsetTop;
    const rowBottom = rowTop + row.offsetHeight;
    const viewTop = scroller.scrollTop;
    const viewBottom = viewTop + scroller.clientHeight;
    if (rowTop < viewTop || rowBottom > viewBottom) {
      scroller.scrollTo({
        top: Math.max(0, rowTop - 16),
        behavior: 'smooth',
      });
    }
  }, [spotlightId, userTookOver]);

  // INFINITE-LOOP SCROLL — the list renders the cities 3x. We start
  // the user near the BEGINNING of the SECOND tile, and whenever they
  // scroll past either edge of that middle tile, we silently teleport
  // them back to the same relative position in the middle tile. Net
  // effect: the user can scroll forever in either direction and never
  // hit a visual end. Hides the "stops after 3x" feeling.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // Wait two frames so the first paint has measured row heights.
    let initRaf = 0;
    initRaf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Place the user at the start of the second tile so there's
        // equal scroll headroom in both directions.
        const total = el.scrollHeight;
        const tile = total / 3;
        if (el.scrollTop < tile * 0.5) {
          el.scrollTop = tile;
        }
      });
    });

    const onScroll = () => {
      const total = el.scrollHeight;
      const tile = total / 3;
      const top = el.scrollTop;
      // Wrap up: scrolled into the third tile → jump back one tile.
      if (top > tile * 2) {
        el.scrollTop = top - tile;
      }
      // Wrap down: scrolled into the first tile → jump forward one.
      else if (top < tile * 0.5) {
        el.scrollTop = top + tile;
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(initRaf);
      el.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{
        background: 'rgba(253,249,242,0.55)',
        border: '1px solid rgba(63,31,45,0.18)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
      }}
    >
      <div
        className="flex items-center justify-between px-3.5 py-2.5"
        style={{
          borderBottom: '1px solid rgba(63,31,45,0.12)',
          background: 'rgba(255,255,255,0.4)',
        }}
      >
        <span
          className="font-mono text-[10px] tracking-[0.22em] uppercase"
          style={{ color: 'rgba(63,31,45,0.6)' }}
        >
          ❀ cities · click to focus
        </span>
        <span
          className="font-mono text-[9.5px] tracking-[0.18em] uppercase"
          style={{ color: 'rgba(63,31,45,0.4)' }}
        >
          scroll ↕
        </span>
      </div>
      {/* Hidden-scrollbar styles so the wrap-around teleport is invisible
          to the user — they just see a list that never ends. */}
      <style jsx>{`
        :global(.city-list-scroller)::-webkit-scrollbar { display: none; }
        :global(.city-list-scroller) {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>
      <ul
        ref={scrollerRef}
        className="city-list-scroller max-h-[460px] overflow-y-auto p-2 space-y-2"
      >
        {/* INFINITE-FEEL list: tile the city list 3x so the list never
            feels like it ends. Adds a `:rep-N` suffix on the key to
            keep React's reconciler happy. */}
        {Array.from({ length: 3 }).flatMap((_, rep) =>
        sorted.map((c) => {
          // A row is "spotlit" if it matches the manual selection OR the
          // current auto-tour city. That drives both styling AND which
          // row carries the data-leader-anchor for the SVG line.
          const isManualActive = c.id === activeId;
          const isSpotlit = isManualActive || c.id === spotlightId;
          // Only the FIRST repetition's spotlit row carries the leader
          // anchor — otherwise the measurement effect would have 3
          // candidates from the 3x tiling and pick one ~at random.
          const isLeaderAnchor = isSpotlit && rep === 0;
          // Up to 3 flyer thumbs (stacked) for visual personality
          const flyerThumbs = c.events
            .map((ev) => ev.photos[0])
            .filter(Boolean)
            .slice(0, 3) as string[];

          return (
            <li key={`${c.id}:rep-${rep}`}>
              <button
                type="button"
                onClick={() => onPickCity(c.id)}
                onMouseEnter={() => onHoverCity(c.id)}
                onMouseLeave={() => onHoverCity(null)}
                className="group w-full text-left rounded-[10px] overflow-hidden transition-all"
                style={{
                  background: isSpotlit
                    ? 'rgba(255,255,255,0.95)'
                    : 'rgba(253,249,242,0.6)',
                  border: `1px solid ${isSpotlit ? 'rgba(255,90,44,0.4)' : 'rgba(63,31,45,0.14)'}`,
                  boxShadow: isSpotlit
                    ? '0 10px 22px -14px rgba(255,90,44,0.45), inset 0 1px 0 rgba(255,255,255,0.7)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.5)',
                  transform: isSpotlit ? 'translateX(2px)' : 'translateX(0)',
                }}
              >
                {/* Ember accent bar on the LEFT — opaque on active */}
                <div className="flex items-stretch relative">
                  <div
                    aria-hidden
                    className="shrink-0 w-1 transition-colors"
                    style={{
                      background: isSpotlit
                        ? 'var(--ember-500)'
                        : 'rgba(212,92,139,0.35)',
                    }}
                  />

                  {/* LEADER ANCHOR DOT — glowing ember dot on the LEFT
                      edge of the spotlit row. The SVG leader line lands
                      exactly here. Only present on the first-rep row
                      so the measurement is unambiguous. */}
                  {isLeaderAnchor && (
                    <span
                      data-leader-anchor="true"
                      aria-hidden
                      className="absolute rounded-full"
                      style={{
                        // Sit on the left edge of the row, vertically centered.
                        left: -5,
                        top: '50%',
                        width: 11,
                        height: 11,
                        marginTop: -5.5,
                        background: 'var(--ember-500)',
                        boxShadow:
                          '0 0 0 3px rgba(253,249,242,0.95), 0 0 0 5px rgba(255,90,44,0.3), 0 0 14px rgba(255,90,44,0.6)',
                        zIndex: 2,
                      }}
                    />
                  )}

                  <div className="flex-1 flex items-center gap-3 px-3 py-2.5 min-w-0">
                    {/* Stacked flyer thumbs */}
                    {flyerThumbs.length > 0 ? (
                      <div
                        className="relative shrink-0 flex"
                        style={{ width: 46, height: 46 }}
                      >
                        {flyerThumbs.map((src, i) => (
                          <div
                            key={i}
                            className="absolute top-0 rounded overflow-hidden"
                            style={{
                              left: i * 10,
                              width: 32,
                              height: 46,
                              border: '1.5px solid #fdf9f2',
                              boxShadow: '0 4px 10px -6px rgba(63,31,45,0.4)',
                              background: 'rgba(255,255,255,0.5)',
                              zIndex: flyerThumbs.length - i,
                              transform: `rotate(${(i - 1) * 4}deg)`,
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span
                        aria-hidden
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          background: isSpotlit ? 'var(--ember-500)' : 'rgba(212,92,139,0.5)',
                        }}
                      />
                    )}

                    {/* Text block */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-display italic leading-tight truncate"
                        style={{
                          color: '#3F1F2D',
                          fontSize: 18,
                        }}
                      >
                        {c.city}
                      </p>
                      <p
                        className="font-mono text-[9.5px] tracking-[0.2em] uppercase mt-0.5 truncate"
                        style={{ color: 'rgba(63,31,45,0.55)' }}
                      >
                        {/* Country + highlight (no event count to keep the
                            "infinite events" feel intact). */}
                        {c.country}
                        {c.highlight && (
                          <>
                            <span style={{ color: 'rgba(63,31,45,0.3)' }}> · </span>
                            <span style={{ color: 'rgba(255,90,44,0.85)' }}>
                              {c.highlight}
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Right glyph — explore arrow / active indicator */}
                    <span
                      className="font-mono text-[14px] shrink-0 transition-transform"
                      style={{
                        color: isSpotlit ? 'var(--ember-500)' : 'rgba(63,31,45,0.35)',
                      }}
                    >
                      {isSpotlit ? '◉' : '↗'}
                    </span>
                  </div>
                </div>
              </button>
            </li>
          );
        }),
        )}
      </ul>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Event detail modal — opens when an event row is clicked in CityCard.
   Portaled to document.body so it sits above the tabs.
   ────────────────────────────────────────────────────────────────────── */
function EventDetailModal({
  event,
  onClose,
}: {
  event: EventItem | null;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!event) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [event, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {event && (
        <motion.div
          key="globe-event-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-10 cursor-pointer"
          style={{
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
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl cursor-default"
          >
            <button
              onClick={onClose}
              aria-label="Close event"
              className="absolute -top-10 right-0 font-mono text-[11px] tracking-[0.22em] uppercase hover:text-ember-400 transition-colors flex items-center gap-2"
              style={{ color: 'rgba(253,249,242,0.8)' }}
            >
              <span aria-hidden>✕</span> close
            </button>
            <div
              className="rounded-[14px] overflow-hidden"
              style={{
                background: '#fdf9f2',
                border: '1.5px solid rgba(255,255,255,0.85)',
                boxShadow:
                  '0 24px 56px -20px rgba(0,0,0,0.6), inset 0 1.5px 0 rgba(255,255,255,0.95)',
              }}
            >
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: '1px dashed rgba(63,31,45,0.18)' }}
              >
                <div className="flex items-baseline gap-3">
                  <span
                    className="font-mono text-[10px] tracking-[0.22em] uppercase"
                    style={{ color: 'rgba(255,90,44,0.85)' }}
                  >
                    EVENT
                  </span>
                  <span className="font-mono text-[10px]" style={{ color: 'rgba(63,31,45,0.4)' }}>•</span>
                  <span
                    className="font-mono text-[10px] tracking-[0.22em] uppercase"
                    style={{ color: 'rgba(63,31,45,0.55)' }}
                  >
                    {event.city} · {new Date(event.startDate).toLocaleString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
              <div className="px-6 md:px-8 py-7 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-6">
                  {/* LEFT: copy + stats + link */}
                  <div>
                    <h3
                      className="font-display italic leading-tight mb-2"
                      style={{ color: '#3F1F2D', fontSize: 'clamp(24px,3.6vw,36px)' }}
                    >
                      {event.name}
                    </h3>
                    {event.venue && (
                      <p
                        className="font-mono text-[10px] tracking-[0.18em] uppercase mb-4"
                        style={{ color: 'rgba(63,31,45,0.55)' }}
                      >
                        {event.venue}
                      </p>
                    )}
                    <p
                      className="font-sans text-[14px] leading-relaxed mb-5"
                      style={{ color: 'rgba(63,31,45,0.78)' }}
                    >
                      {event.description}
                    </p>

                    {/* Stat tiles */}
                    {event.stats && event.stats.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mb-5">
                        {event.stats.map((s, i) => (
                          <div
                            key={i}
                            className="rounded-md px-3 py-2"
                            style={{
                              background: 'rgba(255,255,255,0.6)',
                              border: '1px solid rgba(63,31,45,0.12)',
                            }}
                          >
                            <p className="font-display italic leading-tight" style={{ color: '#3F1F2D', fontSize: 20 }}>
                              {s.value}
                            </p>
                            <p
                              className="font-mono text-[9px] tracking-[0.18em] uppercase mt-0.5"
                              style={{ color: 'rgba(63,31,45,0.55)' }}
                            >
                              {s.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Luma + other links */}
                    {event.links && event.links.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {event.links.map((l, i) => (
                          <a
                            key={i}
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[10.5px] tracking-[0.22em] uppercase px-3 py-1.5 rounded-full transition-colors hover:bg-white/80"
                            style={{
                              border: '1px solid rgba(63,31,45,0.25)',
                              background: 'rgba(255,255,255,0.55)',
                              color: '#3F1F2D',
                            }}
                          >
                            ↗ {l.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* RIGHT: flyer */}
                  <div>
                    {event.photos[0] ? (
                      <div
                        className="relative w-full aspect-[4/5] overflow-hidden rounded-[6px]"
                        style={{
                          border: '1px solid rgba(63,31,45,0.2)',
                          boxShadow: 'inset 0 0 0 2px #fdf9f2',
                          background: 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={event.photos[0]} alt={event.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div
                        className="relative w-full aspect-[4/5] rounded-[6px] flex items-center justify-center"
                        style={{
                          border: '1px solid rgba(63,31,45,0.2)',
                          background: 'rgba(255,255,255,0.5)',
                        }}
                      >
                        <span className="text-6xl" aria-hidden>{event.emoji}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
