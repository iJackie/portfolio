import Link from 'next/link';
import AsciiFlower from './AsciiFlower';

export default function Footer() {
  return (
    <footer className="grainy-ink text-cream-100 mt-32">
      <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-12 py-16 md:py-20 grid md:grid-cols-3 gap-10">
        <div>
          <p className="font-display-italic text-rust-300 text-3xl leading-tight">
            jacqueline mach.
          </p>
          <p className="mt-3 text-cream-100/70 text-sm max-w-[32ch]">
            Head of Community at Infrared Finance. Available for events,
            community strategy, and growth marketing collabs.
          </p>
        </div>

        <div>
          <p className="eyebrow !bg-transparent !border-rust-300/20 !text-rust-300">elsewhere</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><a href="mailto:jacquelinegiale@gmail.com" className="text-cream-100/80 hover:text-rust-300 transition-colors">jacquelinegiale@gmail.com</a></li>
            <li><a href="https://t.me/ijackie_eth" className="text-cream-100/80 hover:text-rust-300 transition-colors">@ijackie_eth (telegram)</a></li>
            <li><a href="https://twitter.com" className="text-cream-100/80 hover:text-rust-300 transition-colors">twitter (add your handle)</a></li>
            <li><a href="https://github.com" className="text-cream-100/80 hover:text-rust-300 transition-colors">github</a></li>
          </ul>
        </div>

        <div>
          <p className="eyebrow !bg-transparent !border-rust-300/20 !text-rust-300">explore</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/" className="text-cream-100/80 hover:text-rust-300 transition-colors">home</Link></li>
            <li><Link href="/events" className="text-cream-100/80 hover:text-rust-300 transition-colors">all events</Link></li>
            <li><Link href="/resume" className="text-cream-100/80 hover:text-rust-300 transition-colors">resume</Link></li>
            <li><a href="/resume.pdf" download className="text-cream-100/80 hover:text-rust-300 transition-colors">download pdf</a></li>
          </ul>
        </div>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 md:px-12 pb-10 flex items-end justify-between">
        <p className="text-[11px] uppercase tracking-[0.14em] text-cream-100/40">
          © {new Date().getFullYear()} · brooklyn → everywhere
        </p>
        <div className="text-rust-300/60">
          <AsciiFlower variant="bouquet" className="!text-rust-300/40" />
        </div>
      </div>
    </footer>
  );
}
