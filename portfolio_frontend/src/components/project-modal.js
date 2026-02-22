/**
 * project-modal.js — HTML modal overlay for project details.
 *
 * When a project panel is clicked in the 3D gallery, this module displays
 * a full-screen modal overlay with the project's title, description,
 * technology tags, image, and links (GitHub / Live Demo).
 *
 * The modal exits the browser's pointer lock (if active from the 3D
 * gallery's first-person camera) so the user can interact with the
 * modal content using their mouse.
 *
 * Accessibility features:
 *   - role="dialog" with aria-modal="true" and aria-label
 *   - Focus is moved to the close button when the modal opens
 *   - Escape key closes the modal
 *   - Clicking the backdrop (outside modal content) closes the modal
 *
 * Only one modal can be open at a time — showProjectModal() removes
 * any existing modal before creating a new one.
 *
 * @module project-modal
 */

/**
 * Display a project detail modal.
 *
 * Creates a full-screen overlay with a centered content card, appends it
 * to document.body, and sets up close handlers (button click, backdrop
 * click, Escape key). Exits pointer lock if active.
 *
 * @param {Object} project - The project data to display
 * @param {string} project.title - Project title
 * @param {string} project.description - Project description
 * @param {string[]} [project.technologies] - Technology tag names
 * @param {string} [project.image] - URL of the project image
 * @param {string} [project.github_url] - URL to the GitHub repository
 * @param {string} [project.live_url] - URL to the live demo
 */
export function showProjectModal(project) {
  // Remove existing modal if any (only one can be open at a time)
  hideProjectModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'project-modal';

  const techs = (project.technologies || [])
    .map((t) => `<span class="modal-tag">${t}</span>`)
    .join('');

  overlay.innerHTML = `
    <div class="modal-content" role="dialog" aria-modal="true" aria-label="${project.title}">
      <button class="modal-close" aria-label="Close">&times;</button>
      ${project.image ? `<img src="${project.image}" alt="${project.title}" class="modal-image" />` : ''}
      <h2 class="modal-title">${project.title}</h2>
      <p class="modal-desc">${project.description}</p>
      <div class="modal-tags">${techs}</div>
      <div class="modal-links">
        ${project.github_url ? `<a href="${project.github_url}" target="_blank" rel="noopener" class="btn btn-outline">GitHub</a>` : ''}
        ${project.live_url ? `<a href="${project.live_url}" target="_blank" rel="noopener" class="btn btn-primary">Live Demo</a>` : ''}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Close when the X button is clicked
  overlay.querySelector('.modal-close').addEventListener('click', hideProjectModal);

  // Close when clicking the backdrop (outside the modal content)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hideProjectModal();
  });

  // Close on Escape key — removes its own listener when fired
  const onKey = (e) => {
    if (e.key === 'Escape') {
      hideProjectModal();
      document.removeEventListener('keydown', onKey);
    }
  };
  document.addEventListener('keydown', onKey);

  // Exit pointer lock so the user's cursor is free to interact with the modal.
  // The 3D gallery uses pointer lock for first-person camera control.
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }

  // Move focus to the close button for keyboard accessibility
  requestAnimationFrame(() => {
    overlay.querySelector('.modal-close').focus();
  });
}

/**
 * Remove the project modal from the DOM.
 * Safe to call even if no modal is open.
 */
export function hideProjectModal() {
  const existing = document.getElementById('project-modal');
  if (existing) existing.remove();
}
