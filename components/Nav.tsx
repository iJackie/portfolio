'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const links = [
  { href: '/#globe',   label: 'globe',      hashOf: '/' },
  { href: '/#events',  label: 'events',     hashOf: '/' },
  { href: '/events',   label: 'all events' },
  { href: '/resume',   label: 'resume' },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-cream-100/70 border-b border-rust-500/10">
      {/* All-centered layout: logo and links sit together in a single
          horizontal group, justified to the page center. */}
      <div className="max-w-[1200px] mx-auto flex items-center justify-center gap-6 md:gap-8 px-6 md:px-12 py-4">
        <Link href="/" className="font-display-italic text-[22px] text-rust-700 leading-none">
          jacqueline.
        </Link>
        <span className="hidden md:inline text-rust-300/70" aria-hidden>·</span>
        <ul className="hidden md:flex items-center gap-6">
          {links.map((l) => {
            const isActive =
              (l.hashOf && path === l.hashOf && typeof window !== 'undefined' && window.location.hash === l.href.slice(1)) ||
              (!l.hashOf && path === l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={cn(
                    'text-[13px] text-ink-900/80 hover:text-rust-500 transition-colors lowercase',
                    isActive && 'text-rust-500'
                  )}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <ul className="md:hidden flex items-center gap-4">
          {[{ href: '/events', label: 'events' }, { href: '/resume', label: 'resume' }].map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-[13px] text-ink-900/80 hover:text-rust-500 lowercase">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
