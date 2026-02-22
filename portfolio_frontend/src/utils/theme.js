/**
 * theme.js — Light/dark mode toggle with persistent preference.
 *
 * The theme is controlled by a 'data-theme' attribute on the <html> element.
 * CSS custom properties in themes.css respond to this attribute to change
 * colors across the entire site.
 *
 * Priority order for initial theme:
 *   1. Saved preference in localStorage (user explicitly toggled)
 *   2. OS/browser preference (prefers-color-scheme media query)
 *   3. Defaults to 'light'
 *
 * @module theme
 */

/** localStorage key for the user's theme preference */
const STORAGE_KEY = 'portfolio-theme';

/**
 * Initialize the theme on page load.
 * Should be called early in main.js to prevent a flash of the wrong theme.
 * Reads the saved preference or falls back to the system preference.
 */
export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);
}

/**
 * Toggle between light and dark themes.
 * Saves the new preference to localStorage.
 *
 * @returns {string} The new theme ('light' or 'dark')
 */
export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

/**
 * Get the currently active theme.
 *
 * @returns {string} 'light' or 'dark'
 */
export function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'light';
}

/**
 * Apply a theme by setting the data-theme attribute and saving to localStorage.
 * The CSS in themes.css uses [data-theme="dark"] selectors to swap color variables.
 *
 * @param {string} theme - 'light' or 'dark'
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
}
