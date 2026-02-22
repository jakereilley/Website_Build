/**
 * admin/contacts.js — Contact submission viewer with read tracking.
 *
 * Admin sub-page for viewing contact form submissions.
 * Loaded as a code-split chunk by the dashboard.
 *
 * Features:
 *   - Displays all contact submissions as cards (newest first from API)
 *   - Unread submissions are highlighted with a "New" badge and
 *     have a "Mark as Read" button
 *   - Clicking "Mark as Read" sends a PUT request to update the
 *     submission's read status, then updates the card in-place
 *     (without reloading the full list)
 *
 * This section is read-only (no create/delete) since submissions are
 * created by visitors through the public contact form.
 *
 * API endpoints used:
 *   - GET /api/contact/ — list all submissions (admin only)
 *   - PUT /api/contact/:id/ — update read status
 *
 * @module pages/admin/contacts
 */

import { get, put } from '../../utils/api.js';

export default {
  /**
   * Mount the contact submissions section into the admin content area.
   * @param {HTMLElement} container - The admin content area element
   */
  async mount(container) {
    container.innerHTML = `
      <div class="admin-section">
        <h2>Contact Submissions</h2>
        <div id="contacts-list"><p class="loading-text">Loading...</p></div>
      </div>
    `;

    const listEl = document.getElementById('contacts-list');

    try {
      const data = await get('/contact/');
      const submissions = data.results || data;

      if (submissions.length === 0) {
        listEl.innerHTML = '<p class="empty-text">No submissions yet.</p>';
        return;
      }

      // Render each submission as a card with read/unread styling
      listEl.innerHTML = submissions
        .map(
          (s) => `
        <div class="contact-card ${s.read ? 'read' : 'unread'}" data-id="${s.id}">
          <div class="contact-card-header">
            <strong>${s.name}</strong>
            <span class="contact-email">${s.email}</span>
            <span class="contact-date">${new Date(s.created_at).toLocaleDateString()}</span>
            ${!s.read ? '<span class="unread-badge">New</span>' : ''}
          </div>
          <p class="contact-subject">${s.subject}</p>
          <p class="contact-message">${s.message}</p>
          ${!s.read ? `<button class="btn-small mark-read-btn" data-id="${s.id}">Mark as Read</button>` : ''}
        </div>
      `
        )
        .join('');

      // "Mark as Read" — update in-place without full reload
      listEl.querySelectorAll('.mark-read-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          await put(`/contact/${btn.dataset.id}/`, { read: true });
          const card = btn.closest('.contact-card');
          card.classList.replace('unread', 'read');
          card.querySelector('.unread-badge')?.remove();
          btn.remove();
        });
      });
    } catch {
      listEl.innerHTML = '<p class="form-status error">Failed to load submissions.</p>';
    }
  },
};
