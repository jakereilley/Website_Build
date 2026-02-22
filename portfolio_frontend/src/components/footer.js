/**
 * footer.js — Site-wide footer component.
 *
 * Renders a simple footer with a copyright notice (auto-updating year)
 * and social media links. Links open in new tabs with rel="noopener"
 * for security.
 *
 * @module footer
 */

/**
 * Mount the footer into the given DOM element.
 * Replaces the element's content with the footer HTML.
 *
 * @param {HTMLElement} el - The container element to render the footer into
 */
export function mountFooter(el) {
  el.innerHTML = `
    <div class="footer-inner container">
      <p>&copy; ${new Date().getFullYear()} Portfolio. Built with purpose.</p>
      <div class="footer-links">
        <a href="https://github.com" target="_blank" rel="noopener" aria-label="GitHub">GitHub</a>
        <a href="https://linkedin.com" target="_blank" rel="noopener" aria-label="LinkedIn">LinkedIn</a>
      </div>
    </div>
  `;
}
