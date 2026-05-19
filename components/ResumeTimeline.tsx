'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Download } from 'lucide-react';

/**
 * Compact horizontal resume timeline for the homepage.
 *
 *   ── 2020 ───── 2023 ───── 2023 ───── 2024 ──── now ──>
 *      [VMware]   [8it]      [Kana]    [Infrared]
 *
 * Each stop is a small card on a continuous gradient rail. Tap "read the
 * full resume" to land on /resume.
 */

type Stop = {
  range: string;
  org: string;
  role: string;
  blurb: string;
  tone: 'rose' | 'sage';
};

const STOPS: Stop[] = [
  {
    range: '2020 — 2023',
    org: 'VMware',
    role: 'Technical Account Manager',
    blurb: 'Ran 10+ enterprise cloud accounts. Where I learned how operators ship at scale.',
    tone: 'sage',
  },
  {
    range: '2023',
    org: '8it / EdibleNFT',
    role: 'Project Manager',
    blurb: 'Shipped the first eat-to-earn event at NFT NYC with chef Christian Petroni & Crypto.com.',
    tone: 'rose',
  },
  {
    range: '2023 — 2024',
    org: 'Kana Co.',
    role: 'Strategy Consultant',
    blurb: 'GTM, comms, and community-strategy for teams crossing from Web2 to Web3.',
    tone: 'sage',
  },
  {
    range: '2024 — now',
    org: 'Infrared Finance',
    role: 'Head of Community',
    blurb: 'Grew the team 8 → 20. Built 30+ partnerships across APAC/EMEA. Shipped 20+ events.',
    tone: 'rose',
  },
];

export default function ResumeTimeline() {
  return (
    <section className="relative overflow-hidden">
      {/* Translucent cream wash + soft corner glows; PageGarden shows through */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(251,246,241,0.55), transparent 75%),' +
            'radial-gradient(ellipse 45% 60% at 100% 100%, rgba(232,121,160,0.14), transparent 60%),' +
            'radial-gradient(ellipse 35% 50% at 0% 0%, rgba(155,189,168,0.14), transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-12 py-20 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <span className="eyebrow">resume · timeline</span>
            <h2 className="font-display-italic text-rust-700 text-[36px] md:text-[52px] leading-[1.05] tracking-tight mt-3">
              the road so far.
            </h2>
          </div>
          <div className="flex gap-2">
            <Link href="/resume" className="btn btn-primary !text-[12px] !py-2 !px-4">
              read the full resume →
            </Link>
            <a href="/resume.pdf" download className="btn btn-ghost !text-[12px] !py-2 !px-4 inline-flex items-center gap-1.5">
              <Download size={12} /> pdf
            </a>
          </div>
        </div>

        {/* Horizontal rail with stops */}
        <div className="relative">
          {/* Continuous gradient line */}
          <div
            className="absolute left-0 right-0 top-[42px] h-px"
            style={{
              background:
                'linear-gradient(90deg, rgba(155,189,168,0.45) 0%, rgba(242,180,199,0.7) 50%, rgba(232,121,160,0.85) 100%)',
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {STOPS.map((s, i) => (
              <motion.div
                key={s.org}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                {/* The dot on the rail */}
                <div className="relative flex justify-center">
                  <div
                    className={`relative w-5 h-5 rounded-full border-2 border-cream-100 z-10 ${
                      s.tone === 'rose' ? 'bg-rust-500' : 'bg-sage-500'
                    }`}
                    style={{
                      boxShadow: s.tone === 'rose'
                        ? '0 0 0 4px rgba(232,121,160,0.22)'
                        : '0 0 0 4px rgba(155,189,168,0.24)',
                    }}
                  />
                </div>

                {/* Card under the dot */}
                <div className="mt-8 bg-white rounded-2xl border border-rust-500/10 p-5 shadow-[0_14px_36px_-22px_rgba(166,64,106,0.25)]">
                  <p className={`text-[10.5px] uppercase tracking-[0.14em] font-medium ${
                    s.tone === 'rose' ? 'text-rust-700' : 'text-sage-700'
                  }`}>
                    {s.range}
                  </p>
                  <h3 className="font-display-italic text-[24px] text-ink-900 leading-tight mt-1">
                    {s.org}
                  </h3>
                  <p className="text-[12px] text-rust-700/85 leading-tight mt-1">
                    {s.role}
                  </p>
                  <p className="text-[13px] text-ink-900/75 leading-snug mt-3">
                    {s.blurb}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
