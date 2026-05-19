'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

/**
 * ResumeFolder — body of the "04 / RESUME" folder.
 *
 *   - Vertical timeline with a CENTERED rail running top → bottom.
 *   - Each stop sits beside the rail; the dot is centered ON the rail.
 *   - Cards alternate LEFT / RIGHT of the rail (zigzag) so the timeline
 *     reads like a milestone trail.
 *   - The live ember dot rides the rail driven by the PAGE scroll
 *     position (no internal scroller, no snap-to-stop). The user
 *     scrolls naturally through the folder content.
 *   - As the live dot crosses each static stop dot, that stop lights up.
 *
 * The page-level <PageFooter /> handles the download + contact CTAs,
 * so this component is pure timeline.
 */

type StopKind = 'work' | 'consult' | 'school' | 'extra';

type Stop = {
  range: string;
  /** YYYYMM of the role's start month, used to sort newest-first. */
  sortKey: number;
  org: string;
  role: string;
  blurb: string;
  scope?: string[];
  tone: 'rose' | 'sage' | 'ember';
  kind: StopKind;
};

const STOPS_RAW: Stop[] = [
  // ── PRESENT — INFRARED ────────────────────────────────────────────
  {
    range: '2024 — now', sortKey: 202401,
    org: 'Infrared Finance', role: 'Head of Community',
    blurb:
      'Built the community function from scratch. Grew the team 8 → 20. Shipped 20+ events across 10+ cities. 30+ partnerships across APAC + EMEA.',
    scope: [
      'Owned global events calendar',
      'Built partner + ambassador programs',
      'Ran content, social, ops, and brand across community surface',
    ],
    tone: 'ember', kind: 'work',
  },
  // ── 2022 — 2024 — CONSULTING (one stop, all engagements rolled in
  //    with their years inline) ──────────────────────────────────────
  {
    range: '2022 — 2024', sortKey: 202201,
    org: 'Kana Co.',
    role: 'Independent Consultant + Strategy Consultant',
    blurb:
      'Multi-year run of independent consulting across the first wave of Web3. Embedded with founders crossing from Web2 to Web3 — GTM, comms, community strategy, live event production.',
    scope: [
      '2023 — 2024 · Kana Co.: GTM positioning + community-launch playbooks for early-stage protocols. Founder + comms coaching.',
      '2022 · 8it / EdibleNFT: produced the first EdibleNFT Food Hunt at NFT NYC. Chef Christian Petroni × Crypto.com collab on the Garlic Butter Sicilian Pizza remix.',
      '2022 · MechArcade: tech-marketing + comms strategy for an NFT project navigating crypto from a Web2 starting point.',
      '2022 · Overtime.tv / BracketX: consulted with Overtime\u2019s Head of Product on integrating Web3 into the future of sports.',
    ],
    tone: 'rose', kind: 'consult',
  },
  // ── 2020 — 2022 — VMWARE ────────────────────────────────────────
  {
    range: 'Jul 2020 — Mar 2022', sortKey: 202007,
    org: 'VMware, Inc.', role: 'Technical Account Manager',
    blurb:
      'Ran enterprise cloud accounts in NYC. Advised companies on deployment, migration, adoption, and operational excellence — built pre- and post-sales relationships across internal and external teams.',
    scope: [
      'Strategic planning + performance optimization',
      'VCP-DCV 2020 certified',
      'Translated account ownership into community ownership',
    ],
    tone: 'sage', kind: 'work',
  },
  // ── 2018 — UCR ITS ──────────────────────────────────────────────
  {
    range: 'Aug 2018 — Jun 2019', sortKey: 201808,
    org: 'UCR · IT Solutions', role: 'IT Help Desk Student Assistant II',
    blurb:
      'Daily technical support for 25,000+ students and faculty across network, peripherals, email, and system maintenance. Tracked + documented tickets in ServiceNow.',
    tone: 'sage', kind: 'work',
  },
  // ── 2018 SUMMER — BELKIN ────────────────────────────────────────
  {
    range: 'Jun — Aug 2018', sortKey: 201806,
    org: 'Belkin · Linksys', role: 'Program Management Intern',
    blurb:
      'Oversaw day-to-day progress of Agile-based Linksys projects across scope, schedule, budget, and quality. Built data dashboards + facilitated Scrum ceremonies.',
    tone: 'sage', kind: 'work',
  },
  // ── 2016 — MICROMOUSE ───────────────────────────────────────────
  {
    range: '2016 — 2017', sortKey: 201609,
    org: 'Micromouse · UCR', role: 'Project Member',
    blurb:
      'Designed, built, and programmed an autonomous robot to solve a 16x16 maze. Drafted the PCB in Autodesk Eagle, coded an STM32 microcontroller in C, used flood-fill to find the fastest path to center.',
    tone: 'sage', kind: 'extra',
  },
  // ── 2015 — UCR ──────────────────────────────────────────────────
  {
    range: '2015 — 2019', sortKey: 201509,
    org: 'UC Riverside',
    role: 'B.S. Business Admin · Information Systems',
    blurb:
      'School of Business Administration — Academic MIS Excellence Award recipient. VMware Certified Professional (VCP-DCV 2020).',
    tone: 'rose', kind: 'school',
  },
];

const STOPS: Stop[] = [...STOPS_RAW].sort((a, b) => b.sortKey - a.sortKey);

const TONE_COLOR: Record<Stop['tone'], string> = {
  rose: 'var(--rust-500)',
  sage: 'var(--sage-500)',
  ember: 'var(--ember-500)',
};

const KIND_LABEL: Record<StopKind, string> = {
  work: 'FULL-TIME',
  consult: 'CONSULTING',
  school: 'EDUCATION',
  extra: 'SIDE PROJECT',
};

export default function ResumeFolder() {
  // Track page-level scroll progress through THIS timeline section
  // (no internal scroller). Live ember dot rides 0→1 as the user
  // scrolls past the section.
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 75%', 'end 25%'],
  });
  const smoothed = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 28,
    mass: 0.6,
  });
  const railScaleY = useTransform(smoothed, [0, 1], [0, 1]);

  // SEAMLESS LIVE DOT — the dot rides the rail linearly with scroll
  // progress (0% → 100%), no magnetic snapping. Static stop dots still
  // light up as the live dot passes each one (driven by activeIdx),
  // but the live dot itself glides smoothly, so the rail feels
  // continuous instead of click-and-hold.
  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => {
    const unsub = smoothed.on('change', (v) => {
      const i = Math.min(
        STOPS.length - 1,
        Math.max(0, Math.round(v * (STOPS.length - 1))),
      );
      setActiveIdx(i);
    });
    return () => unsub();
  }, [smoothed]);

  // dotY rides the rail directly from scroll progress, with 5%/95%
  // padding so the dot never overshoots the rail edges. Pure linear
  // mapping — no spring snap.
  const dotY = useTransform(smoothed, [0, 1], ['5%', '95%']);

  return (
    <div>
      {/* Header */}
      <p
        className="font-mono text-[10px] tracking-[0.3em] mb-3"
        style={{ color: 'rgba(255,90,44,0.85)' }}
      >
        ✦ TIMELINE · MOST RECENT FIRST
      </p>
      <h3
        className="font-display italic text-[clamp(28px,5vw,52px)] leading-[1.05] mb-2"
        style={{ color: '#3F1F2D' }}
      >
        The road so far.
      </h3>
      <p
        className="font-sans text-[15px] leading-relaxed max-w-xl mb-10"
        style={{ color: 'rgba(63,31,45,0.7)' }}
      >
        Most recent role at the top. Scroll down — the dot follows you
        and lights up each stop as it passes.
      </p>

      {/* TIMELINE TRACK — centered rail with cards alternating sides.
          No internal scroller; this is just a tall container in the
          normal page flow.  */}
      <div ref={containerRef} className="relative mx-auto" style={{ maxWidth: 920 }}>
        {/* (a) Faded background rail — PERFECTLY CENTERED via left:50%
            on a 2px-wide element with -1px offset. Dots use the same
            anchoring so they sit EXACTLY on the line. */}
        <div
          aria-hidden
          className="absolute top-0 bottom-0"
          style={{
            left: '50%',
            width: 2,
            marginLeft: -1,
            background: 'rgba(63,31,45,0.14)',
          }}
        />
        {/* (b) Drawn foreground rail — scales with scroll progress */}
        <motion.div
          aria-hidden
          className="absolute top-0 bottom-0 origin-top"
          style={{
            left: '50%',
            width: 2,
            marginLeft: -1,
            scaleY: railScaleY,
            background:
              'linear-gradient(180deg, rgba(255,90,44,0.95) 0%, rgba(232,121,160,0.8) 55%, rgba(155,189,168,0.65) 100%)',
          }}
        />
        {/* (c) LIVE DOT — rides the rail; position from scroll. The
            -8px margin centers the 16px-wide dot perfectly on the 2px
            rail (rail-center is at left:50%, so dot center must be too). */}
        <motion.span
          aria-hidden
          className="absolute rounded-full pointer-events-none z-20"
          style={{
            left: '50%',
            top: dotY,
            width: 16,
            height: 16,
            marginLeft: -8,
            marginTop: -8,
            background: 'var(--ember-500)',
            boxShadow:
              '0 0 0 5px rgba(253,249,242,0.95), 0 0 0 8px rgba(255,90,44,0.32), 0 0 22px rgba(255,90,44,0.65)',
          }}
        />

        {/* Stops list */}
        <div className="flex flex-col">
          {STOPS.map((s, i) => (
            <TimelineStop
              key={`${s.org}-${s.sortKey}`}
              stop={s}
              index={i}
              isActive={i === activeIdx}
              side={i % 2 === 0 ? 'right' : 'left'}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   TimelineStop — single card to one side of the centered rail.
   The static dot sits EXACTLY ON the rail (same left:50% anchor as
   the rail itself, with -dot/2 margin to center). The card sits to
   either the LEFT or RIGHT depending on `side`.
   ────────────────────────────────────────────────────────────────────── */
function TimelineStop({
  stop,
  index,
  isActive,
  side,
}: {
  stop: Stop;
  index: number;
  isActive: boolean;
  side: 'left' | 'right';
}) {
  // Static-dot diameter; matches the rail center anchor math below.
  const DOT = isActive ? 16 : 12;
  return (
    <div
      className="relative flex items-center"
      style={{
        // Each stop is a tall section that the page scrolls past.
        minHeight: 'clamp(260px, 38vh, 360px)',
      }}
    >
      {/* STATIC DOT — anchored at left:50% with negative margins so its
          CENTER sits exactly on the rail's 50% line. */}
      <motion.span
        aria-hidden
        initial={{ scale: 0.6, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: index * 0.04 }}
        className="absolute z-10 rounded-full"
        style={{
          left: '50%',
          top: '50%',
          width: DOT,
          height: DOT,
          marginLeft: -DOT / 2,
          marginTop: -DOT / 2,
          background: TONE_COLOR[stop.tone],
          boxShadow: isActive
            ? `0 0 0 5px rgba(253,249,242,0.95), 0 0 0 8px ${TONE_COLOR[stop.tone]}55, 0 0 22px ${TONE_COLOR[stop.tone]}80`
            : `0 0 0 4px rgba(253,249,242,0.95), 0 0 0 5px ${TONE_COLOR[stop.tone]}40`,
          transition: 'box-shadow 0.3s',
        }}
      />

      {/* CARD — sits on the LEFT or RIGHT of the rail. */}
      <motion.div
        initial={{ opacity: 0, x: side === 'right' ? 24 : -24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: index * 0.05 }}
        className="relative w-[calc(50%-40px)]"
        style={{
          marginLeft: side === 'right' ? 'auto' : 0,
          marginRight: side === 'left' ? 'auto' : 0,
          paddingLeft: side === 'right' ? 32 : 0,
          paddingRight: side === 'left' ? 32 : 0,
        }}
      >
        {/* Small connector tick from rail → card edge */}
        <span
          aria-hidden
          className="absolute top-1/2 h-px"
          style={{
            background: TONE_COLOR[stop.tone],
            opacity: 0.5,
            width: 24,
            transform: 'translateY(-50%)',
            ...(side === 'right' ? { left: 0 } : { right: 0 }),
          }}
        />

        <div
          className="rounded-[10px] px-5 md:px-6 py-5"
          style={{
            background: 'rgba(253,249,242,0.75)',
            border: '1px solid rgba(63,31,45,0.16)',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.7), 0 10px 26px -16px rgba(63,31,45,0.35)',
          }}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
            <span
              className="font-mono text-[10px] tracking-[0.22em] uppercase"
              style={{ color: TONE_COLOR[stop.tone] }}
            >
              {stop.range}
            </span>
            <span
              className="font-mono text-[9.5px] tracking-[0.22em] uppercase px-2 py-0.5 rounded-full"
              style={{
                color: 'rgba(63,31,45,0.6)',
                border: '1px solid rgba(63,31,45,0.18)',
                background: 'rgba(255,255,255,0.55)',
              }}
            >
              {KIND_LABEL[stop.kind]}
            </span>
          </div>

          <h4
            className="font-display italic leading-tight mb-1"
            style={{ color: '#3F1F2D', fontSize: 'clamp(20px,2.2vw,28px)' }}
          >
            {stop.org}
          </h4>

          <p
            className="font-mono text-[10.5px] tracking-[0.18em] uppercase mb-3"
            style={{ color: 'rgba(63,31,45,0.55)' }}
          >
            {stop.role}
          </p>

          <p
            className="font-sans text-[13.5px] leading-relaxed"
            style={{ color: 'rgba(63,31,45,0.78)' }}
          >
            {stop.blurb}
          </p>

          {stop.scope && stop.scope.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {stop.scope.map((line, j) => (
                <li
                  key={j}
                  className="flex items-baseline gap-3 font-sans text-[12.5px]"
                  style={{ color: 'rgba(63,31,45,0.72)' }}
                >
                  <span
                    aria-hidden
                    className="font-mono text-[10px] shrink-0"
                    style={{ color: TONE_COLOR[stop.tone] }}
                  >
                    ◇
                  </span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </div>
  );
}
