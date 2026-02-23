/**
 * contact.js — Contact page that mounts the contact form component.
 *
 * Renders a page header with introductory text, then delegates
 * form rendering and submission logic to the mountContactForm()
 * component from contact-form.js.
 *
 * @module pages/contact
 */

import { mountContactForm } from '../components/contact-form.js';
import { HeroBackground } from '../three/HeroBackground.js';

/** @type {HeroBackground|null} */
let heroBg = null;

export default {
  /**
   * Mount the contact page: render layout and mount the form component.
   * @param {HTMLElement} container - The router's mount element
   */
  mount(container) {
    container.innerHTML = `
      <section class="page">
        <div class="page-bg" id="contact-bg"></div>
        <div class="page-content container contact-page">
          <h1>Get in Touch</h1>
          <p class="page-subtitle">Have a question or want to work together? Drop me a message.</p>
          <div id="contact-form-container"></div>
        </div>
      </section>
    `;

    heroBg = new HeroBackground(document.getElementById('contact-bg'));
    mountContactForm(document.getElementById('contact-form-container'));
  },

  unmount() {
    if (heroBg) { heroBg.dispose(); heroBg = null; }
  },
};
