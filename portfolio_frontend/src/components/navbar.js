/**
 * navbar.js — Sticky navigation bar with theme toggle and mobile menu.
 *
 * Renders a top-of-page navigation bar containing:
 *   - Logo/home link
 *   - Navigation links (Home, Projects, Blog, About, Contact)
 *   - Conditional "Admin" link when the user is authenticated
 *   - Light/dark theme toggle button with sun/moon SVG icons
 *   - Hamburger toggle for mobile viewports
 *
 * The active link is highlighted automatically on every 'hashchange' event,
 * using a prefix match (e.g., #/blog/my-post highlights the "Blog" link).
 *
 * The mobile menu opens/closes via the hamburger button and auto-closes
 * whenever a navigation link is clicked.
 *
 * @module navbar
 */

import { toggleTheme, getTheme } from '../utils/theme.js';
import { isAuthenticated } from '../utils/auth.js';

/**
 * Ordered list of primary navigation links.
 * Each entry maps a human-readable label to a hash route path.
 *
 * @type {Array<{label: string, path: string}>}
 */
const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Projects', path: '/projects' },
  { label: 'Blog', path: '/blog' },
  { label: 'About', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

/**
 * Mount the navbar into the given DOM element.
 * Renders the full navbar HTML and registers a 'hashchange' listener
 * to keep the active link in sync with the current route.
 *
 * @param {HTMLElement} el - The container element to render the navbar into
 */
export function mountNavbar(el) {
  render(el);

  window.addEventListener('hashchange', () => updateActiveLink(el));
}

/**
 * Render the navbar HTML into the container and attach event listeners.
 *
 * Sets up three interactive behaviors:
 *   1. Theme toggle — swaps light/dark mode and updates the button icon
 *   2. Hamburger menu — toggles the mobile nav links panel open/closed
 *   3. Nav link clicks — auto-close the mobile menu after navigation
 *
 * @param {HTMLElement} el - The navbar container element
 */
function render(el) {
  const theme = getTheme();

  el.innerHTML = `
    <div class="nav-inner container">
      <a href="#/" class="nav-logo" aria-label="Home">
        <span class="logo-text">Portfolio</span>
      </a>

      <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>

      <div class="nav-links">
        ${NAV_LINKS.map(
          (link) =>
            `<a href="#${link.path}" class="nav-link ${isActive(link.path) ? 'active' : ''}">${link.label}</a>`
        ).join('')}
        ${isAuthenticated() ? '<a href="#/admin" class="nav-link">Admin</a>' : ''}
      </div>

      <button class="theme-toggle" aria-label="Toggle theme">
        ${theme === 'dark' ? sunIcon() : moonIcon()}
      </button>
    </div>
  `;

  // Theme toggle: swap theme and update icon
  el.querySelector('.theme-toggle').addEventListener('click', () => {
    const newTheme = toggleTheme();
    el.querySelector('.theme-toggle').innerHTML =
      newTheme === 'dark' ? sunIcon() : moonIcon();
  });

  // Hamburger menu: toggle mobile nav panel visibility
  const toggle = el.querySelector('.nav-toggle');
  const links = el.querySelector('.nav-links');
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', !expanded);
    links.classList.toggle('open');
  });

  // Close mobile menu when any nav link is clicked
  links.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/**
 * Update the 'active' class on nav links to reflect the current hash route.
 * Called on every 'hashchange' event.
 *
 * @param {HTMLElement} el - The navbar container element
 */
function updateActiveLink(el) {
  el.querySelectorAll('.nav-link').forEach((link) => {
    const href = link.getAttribute('href').slice(1); // Remove #
    link.classList.toggle('active', isActive(href));
  });
}

/**
 * Check if a given path matches the current URL hash.
 * The root path '/' only matches exactly. All other paths use a prefix
 * match so that child routes highlight their parent link
 * (e.g., '/blog/my-post' highlights '/blog').
 *
 * @param {string} path - The route path to check (e.g., '/blog')
 * @returns {boolean} True if this path should be considered active
 */
function isActive(path) {
  const current = window.location.hash.slice(1) || '/';
  if (path === '/') return current === '/';
  return current.startsWith(path);
}

/**
 * Return an SVG string for the moon icon (shown in light mode).
 * @returns {string} Moon SVG markup
 */
function moonIcon() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}

/**
 * Return an SVG string for the sun icon (shown in dark mode).
 * @returns {string} Sun SVG markup
 */
function sunIcon() {
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
}
