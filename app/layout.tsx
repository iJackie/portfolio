import type { Metadata } from 'next';
import { Inter_Tight, Fraunces, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import GradientCursor from '@/components/GradientCursor';
import './globals.css';

/**
 * Root layout.
 *
 * - Loads three Google fonts via next/font (Inter Tight / Fraunces / JetBrains Mono)
 *   exposed as CSS variables to Tailwind via tailwind.config.ts.
 * - Mounts GradientCursor (sparkle cursor trail).
 * - Wraps all children in <main className="ombre-page"> so the peach × lavender
 *   gradient stretches across the WHOLE document — hero + folders share one
 *   continuous background with no seam.
 */

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['SOFT', 'WONK', 'opsz'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://jacquelinemach.com'),
  title: 'Jacqueline Mach · Growth, Community & Events',
  description:
    'Brooklyn-based growth, community, and events. Scaled a crypto protocol from 8 → 20+ people and $2.5B in TVL, with 20+ events across 10+ cities.',
  openGraph: {
    title: 'Jacqueline Mach · Growth, Community & Events',
    description:
      'Growth · marketing · EA · community · events. 20+ events across 10+ cities.',
    url: 'https://jacquelinemach.com',
    siteName: 'Jacqueline Mach',
    images: [
      {
        url: '/assets/og.jpg',
        width: 1200,
        height: 630,
        alt: 'Jacqueline Mach portfolio',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jacqueline Mach · Growth, Community & Events',
    description:
      'Growth · marketing · EA · community · events. 20+ events across 10+ cities.',
    images: ['/assets/og.jpg'],
    creator: '@berakana_',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Apply a saved dark-mode choice BEFORE first paint (no flash).
            Light is the default for first-time visitors. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}",
          }}
        />
      </head>
      <body>
        <GradientCursor />
        <main className="ombre-page relative">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
