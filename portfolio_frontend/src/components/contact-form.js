/**
 * contact-form.js — Contact form component with client-side validation.
 *
 * Renders a four-field contact form (name, email, subject, message) and
 * handles validation + submission to the Django REST API.
 *
 * Validation rules:
 *   - Name, subject, message: required (non-empty after trimming)
 *   - Email: required + basic format check (user@domain.tld)
 *
 * On submit:
 *   1. Clears previous error messages
 *   2. Validates all fields — shows inline errors below each invalid field
 *   3. If valid, disables the button and shows "Sending..." state
 *   4. POSTs to /api/contact/ via the API client
 *   5. On success: resets the form, shows success message
 *   6. On failure: shows error message
 *   7. Always re-enables the button
 *
 * The form uses native `novalidate` to bypass browser validation in favor
 * of our custom inline error messages.
 *
 * @module contact-form
 */

import { post } from '../utils/api.js';

/**
 * Mount the contact form into the given container element.
 * Renders the form HTML and attaches the submit handler with
 * validation and API submission logic.
 *
 * @param {HTMLElement} container - The element to render the form into
 */
export function mountContactForm(container) {
  container.innerHTML = `
    <form class="contact-form" id="contact-form" novalidate>
      <div class="form-group">
        <label for="contact-name">Name</label>
        <input type="text" id="contact-name" name="name" required />
        <span class="form-error" id="name-error"></span>
      </div>
      <div class="form-group">
        <label for="contact-email">Email</label>
        <input type="email" id="contact-email" name="email" required />
        <span class="form-error" id="email-error"></span>
      </div>
      <div class="form-group">
        <label for="contact-subject">Subject</label>
        <input type="text" id="contact-subject" name="subject" required />
        <span class="form-error" id="subject-error"></span>
      </div>
      <div class="form-group">
        <label for="contact-message">Message</label>
        <textarea id="contact-message" name="message" rows="6" required></textarea>
        <span class="form-error" id="message-error"></span>
      </div>
      <button type="submit" class="btn btn-primary" id="contact-submit">Send Message</button>
      <p class="form-status" id="form-status"></p>
    </form>
  `;

  const form = document.getElementById('contact-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear all previous inline error messages
    form.querySelectorAll('.form-error').forEach((el) => (el.textContent = ''));
    const status = document.getElementById('form-status');
    status.textContent = '';
    status.className = 'form-status';

    // Validate each field — collect all errors before returning
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const subject = form.subject.value.trim();
    const message = form.message.value.trim();
    let valid = true;

    if (!name) {
      document.getElementById('name-error').textContent = 'Name is required.';
      valid = false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById('email-error').textContent = 'Valid email is required.';
      valid = false;
    }
    if (!subject) {
      document.getElementById('subject-error').textContent = 'Subject is required.';
      valid = false;
    }
    if (!message) {
      document.getElementById('message-error').textContent = 'Message is required.';
      valid = false;
    }

    if (!valid) return;

    // Disable button and show loading state during submission
    const btn = document.getElementById('contact-submit');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
      await post('/contact/', { name, email, subject, message });
      status.textContent = 'Message sent successfully!';
      status.classList.add('success');
      form.reset();
    } catch {
      status.textContent = 'Something went wrong. Please try again.';
      status.classList.add('error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send Message';
    }
  });
}
