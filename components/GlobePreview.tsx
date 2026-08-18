'use client';

/**
 * GlobePreview — pixel-dot canvas globe (port of the original
 * event-showcase GlobeCanvas, slimmed for the lanyard folder body).
 *
 *   - Dense dot grid over a sphere; dots are tinted differently on land vs
 *     water so the continents read clearly even at small sizes. Land mask
 *     comes from /data/worldMap.ts (procedural lat/lng boxes per continent).
 *   - Auto-spins gently. Drag to spin manually. An auto-tour spotlights a
 *     new city every few seconds until the visitor picks one.
 *   - Each city in CITIES is projected from real lat/lng and rendered as a
 *     pin with a glow. Front-of-sphere pins are clickable; back-half ones
 *     are z-culled.
 *   - The spotlighted city's card sits in a FIXED column beside the globe
 *     (stacks below it on mobile). Click an event row → full EventModal.
 *
 * No three.js, no react-globe.gl — pure canvas 2D plus a tiny lat/lng → 2D
 * projector. Theme-aware: peach × lavender by day, pink-on-wine-black in
 * dark mode (palette picked per frame from html.dark).
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

/* Canvas colors per theme — the 2D context can't read CSS variables, so
   the draw loop checks html.dark each frame and picks a palette. RGB
   triplet strings keep their alpha at the call site. */
const GLOBE_COLORS = {
  light: {
    haloMid: 'rgba(244,168,193,0.35)',
    haloEdge: 'rgba(244,168,193,0)',
    sphere0: 'rgba(255,244,238,0.85)',
    sphere1: 'rgba(253,230,233,0.55)',
    sphere2: 'rgba(236,218,242,0.35)',
    water: '192,168,210',
    land: '212,92,139',
    pin: '255,90,44',
    pinSoft: '255,138,92',
    core: '255,255,255',
    edge: 'rgba(var(--hi-rgb),0.55)',
  },
  dark: {
    haloMid: 'rgba(255,90,160,0.3)',
    haloEdge: 'rgba(255,90,160,0)',
    sphere0: 'rgba(58,26,46,0.85)',
    sphere1: 'rgba(38,18,30,0.6)',
    sphere2: 'rgba(24,12,20,0.45)',
    water: '150,90,130',
    land: '255,122,181',
    pin: '255,90,160',
    pinSoft: '255,138,192',
    core: '255,238,246',
    edge: 'rgba(255,90,160,0.4)',
  },
};

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

      // Theme palette — checked per frame so toggling dark mode re-tints
      // the globe live (pink dots on a wine-black sphere).
      const C = document.documentElement.classList.contains('dark')
        ? GLOBE_COLORS.dark
        : GLOBE_COLORS.light;

      ctx.clearRect(0, 0, STAGE, STAGE);

      // Soft halo behind the sphere
      const halo = ctx.createRadialGradient(CX, CY, GLOBE_R, CX, CY, GLOBE_R + 28);
      halo.addColorStop(0, C.haloEdge);
      halo.addColorStop(0.55, C.haloMid);
      halo.addColorStop(1, C.haloEdge);
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(CX, CY, GLOBE_R + 28, 0, Math.PI * 2);
      ctx.fill();

      // Sphere base — soft gradient with off-center light source
      const sphereGrad = ctx.createRadialGradient(
        CX - GLOBE_R * 0.3, CY - GLOBE_R * 0.3, GLOBE_R * 0.15,
        CX, CY, GLOBE_R,
      );
      sphereGrad.addColorStop(0, C.sphere0);
      sphereGrad.addColorStop(0.65, C.sphere1);
      sphereGrad.addColorStop(1, C.sphere2);
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(CX, CY, GLOBE_R, 0, Math.PI * 2);
      ctx.fill();

      // Water dots — small and faint
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        if (d.isLand) continue;
        const p = project(d.lat, d.lng + lng);
        if (p.z < -0.02) continue;
        const depthFade = 0.35 + p.z * 0.65;
        ctx.fillStyle = `rgba(${C.water},${0.28 * depthFade})`;
        ctx.fillRect(CX + p.x - 0.5, CY + p.y - 0.5, 1.2, 1.2);
      }

      // Land dots — bigger and saturated so continents pop
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        if (!d.isLand) continue;
        const p = project(d.lat, d.lng + lng);
        if (p.z < -0.02) continue;
        const depthFade = 0.45 + p.z * 0.55;
        ctx.fillStyle = `rgba(${C.land},${0.88 * depthFade})`;
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
          ctx.strokeStyle = `rgba(${C.pin},${0.88 * (1 - pulseT)})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
          ctx.stroke();

          // Bright halo glow
          const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
          glow.addColorStop(0, `rgba(${C.pin},${1.0 * depthFade})`);
          glow.addColorStop(0.5, `rgba(${C.pinSoft},${0.5 * depthFade})`);
          glow.addColorStop(1, `rgba(${C.pinSoft},0)`);
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(cx, cy, 22, 0, Math.PI * 2);
          ctx.fill();

          // Big accent core
          ctx.fillStyle = `rgba(${C.pin},${depthFade})`;
          ctx.beginPath();
          ctx.arc(cx, cy, 4.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(${C.core},${0.95 * depthFade})`;
          ctx.beginPath();
          ctx.arc(cx, cy, 1.6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Subtle breathing ring on EVERY visible pin (staggered phase)
          const breathR = 6 + localPhase * 14;
          const breathAlpha = 0.55 * (1 - localPhase) * depthFade;
          ctx.strokeStyle = `rgba(${C.pin},${breathAlpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy, breathR, 0, Math.PI * 2);
          ctx.stroke();

          // Stronger inactive glow than before so pins read clearly
          const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
          glow.addColorStop(0, `rgba(${C.pin},${0.85 * depthFade})`);
          glow.addColorStop(0.55, `rgba(${C.pinSoft},${0.32 * depthFade})`);
          glow.addColorStop(1, `rgba(${C.pinSoft},0)`);
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(cx, cy, 14, 0, Math.PI * 2);
          ctx.fill();

          // Slightly bigger core dot
          ctx.fillStyle = `rgba(${C.pin},${0.95 * depthFade})`;
          ctx.beginPath();
          ctx.arc(cx, cy, 3.0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(${C.core},${0.95 * depthFade})`;
          ctx.beginPath();
          ctx.arc(cx, cy, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Edge ring
      ctx.strokeStyle = C.edge;
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
        className="font-mono text-[11px] tracking-[0.3em] mb-3 uppercase"
        style={{ color: 'rgba(var(--accent-rgb),0.85)' }}
      >
        ✦ DRAG TO SPIN · CLICK A PIN OR A CITY
      </p>

      {/* TWO-COLUMN layout inside the folder — BIG globe left, city list
          right. The spotlighted city's card POPS OUT of the folder's
          left edge on desktop (~72% of it hangs outside, into the page
          gutter) and stacks below the globe on mobile. */}
      <div className="relative w-full grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-6 md:gap-8 items-start">
        {/* PEEK CARD — desktop: popped out past the folder edge;
            mobile: in-flow below the globe. The translate lives on this
            OUTER positioner so framer-motion can own the transform on
            the inner motion.div without clobbering it.

            Translate is responsive — the outer <main> is `max-w-6xl` (1152px)
            so the card only has room to POP FULLY OUT past the folder edge
            once the viewport is wide enough to give the card a gutter. If
            we always translate -72% the card gets clipped on smaller
            desktop widths. Progression: barely peek at md, more at lg,
            full 72% pop-out only at 2xl (≥1536px). */}
        <div className="order-2 md:order-none md:absolute md:left-0 md:top-6 md:z-30 md:-translate-x-[15%] lg:-translate-x-[35%] xl:-translate-x-[55%] 2xl:-translate-x-[72%] w-full max-w-[280px] mx-auto md:mx-0 md:w-[250px]">
          {/* mode="popLayout" → the OLD card and the NEW card overlap
              during the swap, so the canvas highlight and the visible
              card stay in sync. */}
          <AnimatePresence mode="popLayout">
            {effectiveCity && (
              <motion.div
                key={`peek-${effectiveCity.id}`}
                initial={{ opacity: 0, x: -16, scale: 0.96, rotate: -3 }}
                animate={{ opacity: 1, x: 0, scale: 1, rotate: -1.5 }}
                exit={{ opacity: 0, x: -10, scale: 0.97, rotate: -2 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  filter: 'drop-shadow(0 16px 28px rgba(0,0,0,0.22))',
                }}
              >
                {!activeId && (
                  <p
                    className="font-mono text-[9px] tracking-[0.22em] uppercase mb-1.5 ml-1"
                    style={{ color: 'rgba(var(--accent-rgb),0.85)' }}
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
          className="relative mx-auto order-1 md:order-none"
          style={{
            width: '100%',
            // Big globe — fills its half of the folder like the OG.
            maxWidth: 640,
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
              }
            }}
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
            }}
          />

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
                    background: isActive ? 'var(--ink-strong)' : 'rgba(var(--paper-rgb),0.92)',
                    color: isActive ? 'var(--paper-bright)' : 'rgba(var(--ink-rgb),0.85)',
                    border: `1px solid ${isActive ? 'rgba(var(--accent-rgb),0.6)' : 'rgba(var(--ink-rgb),0.18)'}`,
                    boxShadow: isActive
                      ? '0 6px 18px -8px rgba(var(--accent-rgb),0.55)'
                      : '0 4px 12px -8px rgba(0,0,0,0.25)',
                    transform: isActive ? 'scale(1.06)' : 'scale(1)',
                  }}
                >
                  <span
                    className="font-mono text-[9px] tracking-[0.18em] uppercase"
                    style={{
                      color: isActive ? 'var(--ember-400)' : 'rgba(var(--accent-rgb),0.85)',
                    }}
                  >
                    {p.city.events.length}
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.05em] lowercase">
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
        <div className="order-3 md:order-none w-full">
          <CityList
            cities={CITIES}
            activeId={activeId}
            spotlightId={effectiveCity?.id ?? null}
            onPickCity={(id) => setActiveId((prev) => (prev === id ? null : id))}
            onPickEvent={(ev) => setModalEvent(ev)}
          />
        </div>
      </div>

      {/* Footer — no event/city count, just a soft hint */}
      <p
        className="mt-5 font-mono text-[11px] tracking-[0.22em] uppercase text-center"
        style={{ color: 'rgba(var(--ink-rgb),0.5)' }}
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
  /** Which event row the auto-cycle is spotlighting — drives the
   *  glowing accent dot + row highlight. */
  activeEventIdx: number;
}) {
  return (
    <div
      className="rounded-[10px] px-4 py-3 min-w-[220px] max-w-[280px]"
      style={{
        background: 'rgba(var(--paper-rgb),0.96)',
        border: '1px solid rgba(var(--ink-rgb),0.18)',
        boxShadow:
          'inset 0 1px 0 rgba(var(--hi-rgb),0.7), 0 12px 28px -16px rgba(var(--ink-rgb),0.45)',
      }}
    >
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <span
          className="font-mono text-[9px] tracking-[0.22em] uppercase"
          style={{ color: 'rgba(var(--accent-rgb),0.85)' }}
        >
          {city.country}
        </span>
        <span
          className="font-mono text-[9px] tracking-[0.18em] uppercase"
          style={{ color: 'rgba(var(--ink-rgb),0.45)' }}
        >
          {city.events.length} event{city.events.length > 1 ? 's' : ''}
        </span>
      </div>
      <h4
        className="font-display italic leading-tight mb-2"
        style={{ color: 'var(--ink-strong)', fontSize: 22 }}
      >
        {city.city}
      </h4>
      {city.highlight && (
        <p
          className="font-sans text-[13px] leading-snug mb-3"
          style={{ color: 'rgba(var(--ink-rgb),0.75)' }}
        >
          {city.highlight}
        </p>
      )}
      <ul className="flex flex-col gap-1.5 max-h-[260px] overflow-y-auto">
        {city.events.map((ev, i) => {
          const year = new Date(ev.startDate).getFullYear();
          const flyer = ev.photos[0];
          // The currently-cycled event row gets the glow.
          const isCycled = i === activeEventIdx;
          return (
            <li key={ev.id}>
              <button
                type="button"
                onClick={() => onPickEvent(ev)}
                className="w-full text-left flex items-center gap-2 px-1.5 py-1.5 rounded-md transition-all hover:bg-[rgba(var(--hi-rgb),0.4)]"
                style={{
                  border: `1px solid ${isCycled ? 'rgba(var(--accent-rgb),0.4)' : 'rgba(var(--ink-rgb),0.1)'}`,
                  background: isCycled
                    ? 'rgba(var(--accent-rgb),0.07)'
                    : 'transparent',
                  boxShadow: isCycled
                    ? '0 4px 12px -8px rgba(var(--accent-rgb),0.35)'
                    : 'none',
                }}
              >
                {/* Tiny flyer thumb */}
                <div
                  className="relative shrink-0 w-9 h-9 rounded overflow-hidden"
                  style={{
                    background: 'rgba(var(--hi-rgb),0.5)',
                    border: '1px solid rgba(var(--ink-rgb),0.12)',
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
                  className="flex-1 font-sans text-[13px] leading-tight truncate"
                  style={{ color: 'rgba(var(--ink-rgb),0.9)' }}
                >
                  {ev.name}
                </span>
                <span
                  className="font-mono text-[9px] tracking-[0.18em] shrink-0"
                  style={{ color: 'rgba(var(--accent-rgb),0.75)' }}
                >
                  {year}
                </span>
                {/* Status dot — glows on the auto-cycled row. */}
                <span
                  className="shrink-0 inline-block rounded-full transition-all"
                  style={{
                    width: isCycled ? 9 : 7,
                    height: isCycled ? 9 : 7,
                    marginLeft: 4,
                    background: isCycled
                      ? 'var(--ember-500)'
                      : 'rgba(var(--rose-rgb),0.55)',
                    boxShadow: isCycled
                      ? '0 0 0 3px rgba(var(--accent-rgb),0.25), 0 0 12px rgba(var(--accent-rgb),0.5)'
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
  onPickEvent,
}: {
  cities: City[];
  activeId: string | null;
  /** The currently-spotlighted city (manual OR auto-tour). Used to
   *  auto-scroll the active row into view. */
  spotlightId: string | null;
  onPickCity: (id: string) => void;
  /** Double-clicking a row (or clicking "OPEN") opens the first event
   *  in that city — a shortcut so visitors don't have to focus the
   *  city and THEN click into the left-side peek card. */
  onPickEvent: (e: EventItem) => void;
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

  // Deterministic order — busiest cities first, then alphabetical.
  const sorted = useMemo(
    () =>
      [...cities].sort(
        (a, b) => b.events.length - a.events.length || a.city.localeCompare(b.city),
      ),
    [cities],
  );

  // INFINITE SCROLL — render the sorted list TWICE back-to-back. When
  // the user scrolls past the first copy's height, silently subtract
  // that height from scrollTop so they wrap back to the top of the
  // second copy (which visually is identical). Feels endless.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let wrapping = false;
    const onScroll = () => {
      if (wrapping) return;
      // scrollHeight is the total of both copies rendered
      const half = el.scrollHeight / 2;
      if (half <= 0) return;
      if (el.scrollTop >= half) {
        wrapping = true;
        el.scrollTop -= half;
        requestAnimationFrame(() => { wrapping = false; });
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [sorted.length]);

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

  return (
    <div
      className="rounded-[10px] overflow-hidden"
      style={{
        background: 'rgba(var(--paper-rgb),0.55)',
        border: '1px solid rgba(var(--ink-rgb),0.18)',
        boxShadow: 'inset 0 1px 0 rgba(var(--hi-rgb),0.6)',
      }}
    >
      <div
        className="flex items-center justify-between px-3.5 py-2.5"
        style={{
          borderBottom: '1px solid rgba(var(--ink-rgb),0.12)',
          background: 'rgba(var(--hi-rgb),0.4)',
        }}
      >
        <span
          className="font-mono text-[11px] tracking-[0.22em] uppercase"
          style={{ color: 'rgba(var(--ink-rgb),0.6)' }}
        >
          ❀ cities · click · dbl-click to open
        </span>
        <span
          className="font-mono text-[10.5px] tracking-[0.18em] uppercase"
          style={{ color: 'rgba(var(--ink-rgb),0.4)' }}
        >
          scroll ↕
        </span>
      </div>
      {/* Hidden scrollbar — the header's "scroll ↕" hint covers it. */}
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
        {/* Rendered TWICE for the infinite-scroll wrap. Each rendered
            row still passes through the same onPickCity/onPickEvent
            handlers, so behavior is identical either copy. Only the
            FIRST copy registers row refs (used by the auto-scroll
            effect to jog the spotlighted row into view). */}
        {[...sorted, ...sorted].map((c, idx) => {
          const isFirstCopy = idx < sorted.length;
          // A row is "spotlit" if it matches the manual selection OR the
          // current auto-tour city.
          const isSpotlit = c.id === activeId || c.id === spotlightId;
          // Up to 3 flyer thumbs (stacked) for visual personality
          const flyerThumbs = c.events
            .map((ev) => ev.photos[0])
            .filter(Boolean)
            .slice(0, 3) as string[];

          // Double-click opens the FIRST event in the city — a shortcut
          // so visitors don't have to focus the city then click the
          // left-side peek card.
          const firstEvent = c.events[0];

          return (
            <li
              key={`${c.id}-${isFirstCopy ? 'a' : 'b'}`}
              ref={(el) => {
                // Only the first copy registers a ref (used by auto-scroll).
                if (!isFirstCopy) return;
                if (el) rowRefs.current.set(c.id, el);
                else rowRefs.current.delete(c.id);
              }}
            >
              <button
                type="button"
                onClick={() => onPickCity(c.id)}
                onDoubleClick={() => firstEvent && onPickEvent(firstEvent)}
                title={firstEvent ? 'Double-click to open the event' : undefined}
                className="group w-full text-left rounded-[10px] overflow-hidden transition-all"
                style={{
                  background: isSpotlit
                    ? 'rgba(var(--hi-rgb),0.5)'
                    : 'rgba(var(--paper-rgb),0.6)',
                  border: `1px solid ${isSpotlit ? 'rgba(var(--accent-rgb),0.4)' : 'rgba(var(--ink-rgb),0.14)'}`,
                  boxShadow: isSpotlit
                    ? '0 10px 22px -14px rgba(var(--accent-rgb),0.45)'
                    : 'none',
                  transform: isSpotlit ? 'translateX(2px)' : 'translateX(0)',
                }}
              >
                {/* Accent bar on the LEFT — opaque on active */}
                <div className="flex items-stretch relative">
                  <div
                    aria-hidden
                    className="shrink-0 w-1 transition-colors"
                    style={{
                      background: isSpotlit
                        ? 'var(--ember-500)'
                        : 'rgba(var(--rose-rgb),0.35)',
                    }}
                  />

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
                              border: '1.5px solid var(--paper-bright)',
                              boxShadow: '0 4px 10px -6px rgba(var(--ink-rgb),0.4)',
                              background: 'rgba(var(--hi-rgb),0.5)',
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
                          background: isSpotlit ? 'var(--ember-500)' : 'rgba(var(--rose-rgb),0.5)',
                        }}
                      />
                    )}

                    {/* Text block */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-display italic leading-tight truncate"
                        style={{
                          color: 'var(--ink-strong)',
                          fontSize: 18,
                        }}
                      >
                        {c.city}
                      </p>
                      <p
                        className="font-mono text-[10.5px] tracking-[0.2em] uppercase mt-0.5 truncate"
                        style={{ color: 'rgba(var(--ink-rgb),0.55)' }}
                      >
                        {/* Country + highlight (no event count to keep the
                            "infinite events" feel intact). */}
                        {c.country}
                        {c.highlight && (
                          <>
                            <span style={{ color: 'rgba(var(--ink-rgb),0.3)' }}> · </span>
                            <span style={{ color: 'rgba(var(--accent-rgb),0.85)' }}>
                              {c.highlight}
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Right glyph — explore arrow / active indicator */}
                    <span
                      className="font-mono text-[15px] shrink-0 transition-transform"
                      style={{
                        color: isSpotlit ? 'var(--ember-500)' : 'rgba(var(--ink-rgb),0.35)',
                      }}
                    >
                      {isSpotlit ? '◉' : '↗'}
                    </span>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
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
            // Backdrop scrim stays dark plum in BOTH themes — it sits
            // over the page, not on it.
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
              className="absolute -top-10 right-0 font-mono text-[12px] tracking-[0.22em] uppercase hover:text-ember-400 transition-colors flex items-center gap-2"
              style={{ color: 'rgba(253,249,242,0.8)' /* light in both themes — sits on the dark scrim */ }}
            >
              <span aria-hidden>✕</span> close
            </button>
            <div
              className="rounded-[14px] overflow-hidden"
              style={{
                background: 'var(--paper-bright)',
                border: '1.5px solid rgba(var(--hi-rgb),0.85)',
                boxShadow:
                  '0 24px 56px -20px rgba(0,0,0,0.6), inset 0 1.5px 0 rgba(var(--hi-rgb),0.95)',
              }}
            >
              <div
                className="flex items-center justify-between px-6 py-4"
                style={{ borderBottom: '1px dashed rgba(var(--ink-rgb),0.18)' }}
              >
                <div className="flex items-baseline gap-3">
                  <span
                    className="font-mono text-[11px] tracking-[0.22em] uppercase"
                    style={{ color: 'rgba(var(--accent-rgb),0.85)' }}
                  >
                    EVENT
                  </span>
                  <span className="font-mono text-[11px]" style={{ color: 'rgba(var(--ink-rgb),0.4)' }}>•</span>
                  <span
                    className="font-mono text-[11px] tracking-[0.22em] uppercase"
                    style={{ color: 'rgba(var(--ink-rgb),0.55)' }}
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
                      style={{ color: 'var(--ink-strong)', fontSize: 'clamp(24px,3.6vw,36px)' }}
                    >
                      {event.name}
                    </h3>
                    {event.venue && (
                      <p
                        className="font-mono text-[11px] tracking-[0.18em] uppercase mb-4"
                        style={{ color: 'rgba(var(--ink-rgb),0.55)' }}
                      >
                        {event.venue}
                      </p>
                    )}
                    <p
                      className="font-sans text-[15px] leading-relaxed mb-5"
                      style={{ color: 'rgba(var(--ink-rgb),0.78)' }}
                    >
                      {event.description}
                    </p>

                    {/* WHAT I DID — case-study bullets when present */}
                    {event.role && event.role.length > 0 && (
                      <div className="mb-5">
                        <p
                          className="font-mono text-[10.5px] tracking-[0.22em] uppercase mb-2"
                          style={{ color: 'rgba(var(--accent-rgb),0.85)' }}
                        >
                          ✦ WHAT I DID
                        </p>
                        <ul className="space-y-1.5">
                          {event.role.map((line, i) => (
                            <li
                              key={i}
                              className="flex items-baseline gap-2.5 font-sans text-[14px] leading-relaxed"
                              style={{ color: 'rgba(var(--ink-rgb),0.78)' }}
                            >
                              <span aria-hidden className="font-mono text-[9px] shrink-0" style={{ color: 'var(--ember-500)' }}>
                                ◇
                              </span>
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Stat tiles */}
                    {event.stats && event.stats.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mb-5">
                        {event.stats.map((s, i) => (
                          <div
                            key={i}
                            className="rounded-md px-3 py-2"
                            style={{
                              background: 'rgba(var(--hi-rgb),0.6)',
                              border: '1px solid rgba(var(--ink-rgb),0.12)',
                            }}
                          >
                            <p className="font-display italic leading-tight" style={{ color: 'var(--ink-strong)', fontSize: 20 }}>
                              {s.value}
                            </p>
                            <p
                              className="font-mono text-[9px] tracking-[0.18em] uppercase mt-0.5"
                              style={{ color: 'rgba(var(--ink-rgb),0.55)' }}
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
                            className="font-mono text-[11.5px] tracking-[0.22em] uppercase px-3 py-1.5 rounded-full transition-colors hover:bg-[rgba(var(--hi-rgb),0.5)]"
                            style={{
                              border: '1px solid rgba(var(--ink-rgb),0.25)',
                              background: 'rgba(var(--hi-rgb),0.55)',
                              color: 'var(--ink-strong)',
                            }}
                          >
                            ↗ {l.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* RIGHT: photo column — renders EVERY event.photos entry
                      (not just [0]) so multi-photo events show every photo.
                      Uses w-full h-auto (natural aspect, no cropping) instead
                      of the old aspect-[4/5] + object-cover which cropped
                      wide flyers on both sides. */}
                  <div className="flex flex-col gap-3">
                    {event.photos.length === 0 ? (
                      <div
                        className="relative w-full aspect-[4/5] rounded-[6px] flex items-center justify-center"
                        style={{
                          border: '1px solid rgba(var(--ink-rgb),0.2)',
                          background: 'rgba(var(--hi-rgb),0.5)',
                        }}
                      >
                        <span className="text-6xl" aria-hidden>{event.emoji}</span>
                      </div>
                    ) : (
                      event.photos.map((src, i) => (
                        <div
                          key={src}
                          className="relative w-full overflow-hidden rounded-[6px] flex items-center justify-center"
                          style={{
                            border: '1px solid rgba(var(--ink-rgb),0.2)',
                            boxShadow: 'inset 0 0 0 2px var(--paper-bright)',
                            background: 'rgba(var(--hi-rgb),0.35)',
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt={i === 0 ? event.name : `${event.name} — photo ${i + 1}`}
                            className="block w-full h-auto"
                            style={{ maxWidth: '100%' }}
                            loading={i === 0 ? undefined : 'lazy'}
                          />
                        </div>
                      ))
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
