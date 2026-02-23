/**
 * home.js — Landing page with 3D hero background.
 *
 * Displays the main hero section with:
 *   - A decorative 3D background (floating wireframe shapes via HeroBackground)
 *   - Hero title, subtitle, and call-to-action buttons
 *
 * The HeroBackground renders behind the text content using an absolute-
 * positioned transparent canvas. It is disposed on unmount to free the
 * WebGL context and stop the animation loop.
 *
 * @module pages/home
 */

import { HeroBackground } from '../three/HeroBackground.js';

/** @type {HeroBackground|null} Active 3D background instance */
let heroBackground = null;

export default {
  /**
   * Mount the home page: render hero HTML and start the 3D background.
   * @param {HTMLElement} container - The router's mount element
   */
  mount(container) {
    container.innerHTML = `
      <section class="page hero-section">
        <div class="hero-bg" id="hero-bg"></div>
        <div class="container hero-content">
          <h1 class="hero-title">Aspiring Full Stack Developer</h1>
          <p class="hero-subtitle">Building immersive digital experiences with code, design, and a love for the craft.</p>
          <div class="hero-actions">
            <a href="#/projects" class="btn btn-primary">View Projects</a>
            <a href="#/contact" class="btn btn-outline">Get in Touch</a>
          </div>
        </div>
      </section>
    `;

    const bgContainer = document.getElementById('hero-bg');
    heroBackground = new HeroBackground(bgContainer);
  },

  /**
   * Unmount: dispose the 3D background to free WebGL resources.
   */
  unmount() {
    if (heroBackground) {
      heroBackground.dispose();
      heroBackground = null;
    }
  },
};
