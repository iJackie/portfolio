'use client';

import { useEffect, useState } from 'react';

/**
 * ThemeToggle — cute mono-pill ☾/☀ button, fixed bottom-right so it
 * never collides with the hero's corner UI. Toggles the `dark` class
 * on <html> and persists the choice to localStorage ('dark'|'light').
 *
 * Light is the default — the inline script in layout.tsx applies a
 * saved 'dark' choice before first paint so there's no flash.
 */
export default function ThemeToggle() {
  // null until mounted so SSR markup never disagrees with the client.
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      /* private browsing — theme just won't persist */
    }
    setIsDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="mono-pill fixed z-[120] transition-transform hover:scale-105"
      style={{ bottom: 16, right: 16, cursor: 'pointer' }}
    >
      <span className="glyph" aria-hidden>
        {isDark === null ? '✦' : isDark ? '☀' : '☾'}
      </span>
      {isDark === null ? 'theme' : isDark ? 'light mode' : 'dark mode'}
    </button>
  );
}
