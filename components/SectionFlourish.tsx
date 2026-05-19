/**
 * SectionFlourish — a tiny floral divider that replaces the harsh, blocky
 * borders between sections.
 *
 *   ── · ❀ · ──
 *
 * Sits centered on the page, transparent background so the PageGarden's
 * gradient flows through it untouched. Different glyph per use to feel
 * intentional.
 */

type Props = {
  glyph?: string;
};

export default function SectionFlourish({ glyph = '❀' }: Props) {
  return (
    <div
      aria-hidden
      className="relative flex items-center justify-center py-4 md:py-6 select-none"
    >
      <div className="flex items-center gap-4">
        <span className="block w-16 md:w-24 h-px bg-gradient-to-r from-transparent via-rust-300/60 to-rust-300/80" />
        <span className="text-rust-300/70 text-[10px]">·</span>
        <span className="text-rust-500/85 text-[18px] md:text-[20px] leading-none">{glyph}</span>
        <span className="text-rust-300/70 text-[10px]">·</span>
        <span className="block w-16 md:w-24 h-px bg-gradient-to-l from-transparent via-rust-300/60 to-rust-300/80" />
      </div>
    </div>
  );
}
