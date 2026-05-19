import Link from 'next/link';
import AsciiFlower from './AsciiFlower';

export default function About() {
  return (
    <section className="relative overflow-hidden">
      {/* Translucent cream wash so content stays readable over PageGarden */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(251,246,241,0.55), transparent 75%),' +
            'radial-gradient(ellipse 55% 70% at 0% 100%, rgba(232,121,160,0.16), transparent 60%),' +
            'radial-gradient(ellipse 45% 60% at 100% 0%, rgba(155,189,168,0.18), transparent 60%)',
        }}
      />
      <div className="absolute top-10 right-10 hidden md:block z-10">
        <AsciiFlower variant="bloom" />
      </div>
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-12 py-24 md:py-32 grid md:grid-cols-[1fr_1.2fr] gap-12 items-center">
        <div className="relative">
          <div className="relative aspect-square max-w-[420px] grainy-rust rounded-3xl overflow-hidden">
            {/* Profile photo with a soft gradient blend */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/PFPpng.png"
              alt="Jacqueline Mach"
              className="w-full h-full object-cover mix-blend-multiply opacity-95"
            />
          </div>
        </div>
        <div>
          <span className="eyebrow">about</span>
          <h2 className="font-display-italic text-rust-700 text-[40px] md:text-[56px] leading-[1.05] tracking-tight mt-4">
            community first, <span className="text-sage-700">always.</span>
          </h2>
          <div className="mt-6 space-y-4 text-ink-900/80 max-w-[58ch]">
            <p>
              I&apos;m Jacqueline, currently Head of Community at Infrared Finance,
              the largest liquid-staking protocol on Berachain (peak TVL $2.5B).
              I led global GTM and 30+ ecosystem partnerships across APAC and EMEA,
              and shipped 20+ events from spas in Bangkok to bowling nights in Denver.
            </p>
            <p>
              Before Infrared I was a Web3 strategy consultant at Kana Co.,
              project-managed EdibleNFT&apos;s first eat-to-earn event at NFT NYC,
              and spent four years as a Technical Account Manager at VMware running
              enterprise cloud accounts.
            </p>
            <p>
              I&apos;m based in Brooklyn but you&apos;ll find me wherever the next conference
              is. Currently expanding into AI while keeping the crypto-native community
              work alive.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/resume" className="btn btn-primary">read the full resume →</Link>
            <a href="/resume.pdf" download className="btn btn-ghost">download pdf</a>
          </div>
        </div>
      </div>
    </section>
  );
}
