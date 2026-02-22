/**
 * toast.js — Lightweight toast notification system.
 *
 * Displays temporary notification messages in the top-right corner of the screen.
 * Toasts automatically slide in, display for a set duration, then slide out and
 * remove themselves from the DOM.
 *
 * The toast container uses aria-live="polite" so screen readers announce
 * new notifications without interrupting the user.
 *
 * Usage:
 *   import { showToast } from './toast.js';
 *
 *   showToast('Message sent!', 'success');
 *   showToast('Something went wrong', 'error');
 *   showToast('Loading...', 'info', 2000);
 *
 * @module toast
 */

/** @type {HTMLElement|null} The persistent container element for all toasts */
let container = null;

/**
 * Create the toast container if it doesn't exist yet.
 * The container is appended to document.body and persists for the session.
 *
 * @returns {HTMLElement} The toast container element
 */
function ensureContainer() {
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Display a toast notification.
 *
 * @param {string} message - The text to display
 * @param {'info'|'success'|'error'} type - Visual style of the toast
 * @param {number} duration - How long to show the toast in milliseconds (default: 4000)
 */
export function showToast(message, type = 'info', duration = 4000) {
  const c = ensureContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  c.appendChild(toast);

  // Use requestAnimationFrame to ensure the element is in the DOM before
  // adding the 'show' class, which triggers the CSS slide-in transition
  requestAnimationFrame(() => toast.classList.add('show'));

  // After the duration, slide out and remove
  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove());
  }, duration);
}
