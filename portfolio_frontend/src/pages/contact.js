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

export default {
  /**
   * Mount the contact page: render layout and mount the form component.
   * @param {HTMLElement} container - The router's mount element
   */
  mount(container) {
    container.innerHTML = `
      <section class="page">
        <div class="container contact-page">
          <h1>Get in Touch</h1>
          <p class="page-subtitle">Have a question or want to work together? Drop me a message.</p>
          <div id="contact-form-container"></div>
        </div>
      </section>
    `;

    mountContactForm(document.getElementById('contact-form-container'));
  },

  unmount() {},
};
