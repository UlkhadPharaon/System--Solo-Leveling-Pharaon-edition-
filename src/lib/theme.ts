/**
 * Theme engine — dark (default "Pharaoh obsidian") / light ("Papyrus") modes.
 *
 * The entire palette lives in CSS custom properties (src/index.css `@theme`),
 * so switching themes is a single attribute flip on <html>: every Tailwind
 * color utility (bg-obsidian, text-gold-bright…) reads var(--color-*) at
 * paint time and re-resolves instantly. No component changes required.
 */

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'aura_theme';

/** Read the persisted theme; defaults to dark (the original design). */
export function getStoredTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

/** Apply a theme to <html> and persist it. Idempotent. */
export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  // Keep the UA aware (form controls, scrollbars, meta theme-color consumers).
  document.documentElement.style.colorScheme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* private mode — theme still applies for this session */
  }
}

export function toggleTheme(): Theme {
  const next: Theme = getStoredTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

/** Called once from main.tsx BEFORE first React render — prevents flash. */
export function initTheme(): void {
  applyTheme(getStoredTheme());
}
