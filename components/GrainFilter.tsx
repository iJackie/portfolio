/**
 * Global SVG grain filter — drop into <body> once so multiple gradient
 * blobs can share it via filter="url(#grain)".
 */
export default function GrainFilter() {
  return (
    <svg
      aria-hidden
      width={0}
      height={0}
      style={{ position: 'absolute', width: 0, height: 0 }}
    >
      <defs>
        <filter id="grain">
          <feTurbulence baseFrequency="0.9" numOctaves="2" seed="5" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.45 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}
