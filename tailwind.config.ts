import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Primary palette: soft rose pinks. Keeping the 'rust' name as the
         * class alias so all existing components keep working, but the values
         * are pink now. */
        rust: {
          50:  '#FDF4F7',
          100: '#FCE4EC',
          200: '#F8CFDC',
          300: '#F2B4C7',
          400: '#EC93AE',
          500: '#E879A0',
          600: '#D45C8B',
          700: '#A6406A',
          800: '#7A2D50',
          900: '#4B1A30',
        },
        rose: {
          50:  '#FDF4F7',
          100: '#FCE4EC',
          200: '#F8CFDC',
          300: '#F2B4C7',
          400: '#EC93AE',
          500: '#E879A0',
          600: '#D45C8B',
          700: '#A6406A',
          800: '#7A2D50',
          900: '#4B1A30',
        },
        cream: {
          50:  '#FFFBF7',
          100: '#FBF6F1',
          200: '#F2EBE4',
          300: '#E8DED3',
        },
        warm: {
          100: '#EDE7E1',
          200: '#DDD4CB',
          300: '#C9C2BB',
          400: '#9C928A',
          500: '#6E625A',
          600: '#4F4640',
          700: '#332D29',
        },
        /* Sage softened to a dustier, more romantic green. Used sparingly. */
        sage: {
          100: '#EEF5F0',
          300: '#BCD3C5',
          500: '#9BBDA8',
          600: '#7FA68C',
          700: '#5C8770',
        },
        /* Ink is now a warm plum-brown instead of charcoal, to feel softer.
           700/900 read from CSS channel vars so they flip in dark mode
           while keeping /80-style alpha modifiers working. */
        ink: {
          700: 'rgb(var(--ink-700-ch) / <alpha-value>)',
          800: '#3F1F2D',
          900: 'rgb(var(--ink-900-ch) / <alpha-value>)',
        },
        /* Paper — warm cream archive paper tones for folders + backgrounds */
        paper: {
          50:  '#F4F0E8',
          100: '#EBE5D8',
          200: '#D8D2C2',
          300: '#BFB7A4',
        },
        /* Moss — deep archival green from the binder reference */
        moss: {
          300: '#A8B59A',
          400: '#7A8A6E',
          500: '#5C6F50',
          700: '#3D4A35',
          900: '#222B1E',
        },
        /* Ember — the hot orange "crosshair" pop, used sparingly */
        ember: {
          300: '#FFB38A',
          400: '#FF8A5C',
          500: '#FF5A2C',
          600: '#E0431A',
        },
        /* Plum — keeping the existing deep plum as a named token */
        plum: {
          700: '#3F1F2D',
          900: '#1A0F1F',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Times New Roman', 'Georgia', 'serif'],
        sans:    ['var(--font-inter-tight)', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['var(--font-jetbrains)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        pill: '9999px',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%':   { transform: 'scale(0.85)', opacity: '0.7' },
          '100%': { transform: 'scale(1.8)',  opacity: '0' },
        },
        'lanyard-idle': {
          '0%,100%': { transform: 'rotate(-0.4deg)' },
          '50%':     { transform: 'rotate(0.4deg)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.16, 1, 0.3, 1) infinite',
        'lanyard-idle': 'lanyard-idle 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
