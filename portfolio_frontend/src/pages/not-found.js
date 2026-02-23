/**
 * not-found.js — 404 error page for unmatched routes.
 *
 * Displayed when the router can't match the current URL hash to any
 * registered route pattern. Registered as the '*' wildcard route
 * in main.js.
 *
 * Shows a large "404" heading, a brief message, and a button to
 * navigate back to the home page.
 *
 * @module pages/not-found
 */

import { HeroBackground } from '../three/HeroBackground.js';

/** @type {HeroBackground|null} */
let heroBg = null;

export default {
  /**
   * Mount the 404 page.
   * @param {HTMLElement} container - The router's mount element
   */
  mount(container) {
    container.innerHTML = `
      <section class="page">
        <div class="page-bg" id="not-found-bg"></div>
        <div class="page-content container" style="text-align: center; padding-top: 4rem;">
          <h1 style="font-size: 4rem; color: var(--primary);">404</h1>
          <p style="color: var(--text-muted); margin: 1rem 0 2rem;">Page not found.</p>
          <a href="#/" class="btn btn-primary">Go Home</a>
        </div>
      </section>
    `;

    heroBg = new HeroBackground(document.getElementById('not-found-bg'));
  },

  unmount() {
    if (heroBg) { heroBg.dispose(); heroBg = null; }
  },
};
