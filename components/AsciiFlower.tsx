'use client';

import { cn } from '@/lib/cn';

/**
 * Decorative ASCII flowers for section corners. Static, low-contrast, and
 * non-selectable — they read as ornamental texture, not content.
 */

const FLOWERS: Record<string, string> = {
  bloom: `
    .::.
   :;;;:
  :;|;;;:
   :;;|;
    |||
    |||
    \\|/
`,
  daisy: `
     _
   _(_)_
  (_) _(_)
    (_)
     |
     |
`,
  sprig: `
    \\|/
   --*--
    /|\\
     |
     |
     ~
`,
  bouquet: `
   ❀  ❀
  *  ❀  *
   \\ | /
    \\|/
     |
     ~
`,
  tulip: `
    ___
   /   \\
  |     |
   \\___/
     |
     |
    \\|/
`,
};

type Props = {
  variant?: keyof typeof FLOWERS;
  className?: string;
};

export default function AsciiFlower({ variant = 'bloom', className }: Props) {
  return (
    <pre
      aria-hidden
      className={cn(
        'select-none pointer-events-none font-mono text-[10px] leading-[1.1] text-warm-500/40 tracking-tighter',
        className
      )}
    >
      {FLOWERS[variant].replace(/^\n/, '')}
    </pre>
  );
}
