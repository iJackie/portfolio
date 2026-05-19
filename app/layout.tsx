import type { Metadata } from 'next';
import { Inter_Tight, Fraunces, JetBrains_Mono } from 'next/font/google';
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
  title: 'Jacqueline Mach — Portfolio Lanyard',
  description:
    'Brooklyn-based, formerly Head of Community at Infrared Finance. 20+ events shipped across 10+ cities.',
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
    >
      <body>
        <GradientCursor />
        <main className="ombre-page relative">{children}</main>
      </body>
    </html>
  );
}
