/**
 * admin/dashboard.js — Protected admin dashboard with sidebar navigation.
 *
 * The main admin shell that provides:
 *   - Authentication guard — redirects to /admin/login if not authenticated
 *   - Sidebar navigation between admin sections (Projects, Blog, Contacts, Resume)
 *   - Lazy-loaded admin sub-pages via dynamic imports (code-split)
 *   - Logout button that clears JWT tokens and redirects to home
 *
 * Admin sub-pages are loaded on-demand using the sectionLoaders map.
 * Each sub-page is a separate Vite chunk, keeping the initial bundle small.
 * The loaded module's default export must have a mount(container) method.
 *
 * The sidebar tracks the active section and highlights the corresponding
 * button. The "projects" section loads by default on first visit.
 *
 * @module pages/admin/dashboard
 */

import { isAuthenticated, logout } from '../../utils/auth.js';
import { navigate } from '../../utils/router.js';

/**
 * Available admin sections displayed in the sidebar.
 * Each entry maps an id (used for dynamic import lookup) to a label.
 * @type {Array<{id: string, label: string}>}
 */
const ADMIN_SECTIONS = [
  { id: 'projects', label: 'Projects' },
  { id: 'blog', label: 'Blog Posts' },
  { id: 'contacts', label: 'Contact Submissions' },
  { id: 'resume', label: 'Resume' },
];

/** @type {string} Currently active sidebar section */
let currentSection = 'projects';

export default {
  /**
   * Mount the admin dashboard. Redirects to login if not authenticated.
   * Renders the sidebar and loads the default section.
   * @param {HTMLElement} container - The router's mount element
   */
  mount(container) {
    // Auth guard — redirect unauthenticated users to login
    if (!isAuthenticated()) {
      navigate('/admin/login');
      return;
    }

    container.innerHTML = `
      <section class="page">
        <div class="container admin-dashboard">
          <div class="admin-header">
            <h1>Admin Dashboard</h1>
            <button class="btn btn-outline" id="logout-btn">Logout</button>
          </div>
          <div class="admin-layout">
            <nav class="admin-sidebar">
              ${ADMIN_SECTIONS.map(
                (s) =>
                  `<button class="admin-nav-btn ${s.id === currentSection ? 'active' : ''}" data-section="${s.id}">${s.label}</button>`
              ).join('')}
            </nav>
            <div class="admin-content" id="admin-content">
              <p>Select a section to manage.</p>
            </div>
          </div>
        </div>
      </section>
    `;

    // Logout: clear tokens and redirect to home
    document.getElementById('logout-btn').addEventListener('click', () => {
      logout();
      navigate('/');
    });

    // Sidebar navigation: switch between admin sections
    container.querySelector('.admin-sidebar').addEventListener('click', (e) => {
      const btn = e.target.closest('.admin-nav-btn');
      if (!btn) return;

      currentSection = btn.dataset.section;
      container.querySelectorAll('.admin-nav-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.section === currentSection);
      });

      loadSection(currentSection);
    });

    // Load the default section on first mount
    loadSection(currentSection);
  },

  unmount() {},
};

/**
 * Map of section IDs to dynamic import functions.
 * Each function returns a Promise that resolves to the section module.
 * Using explicit functions (not template literals) satisfies Vite's
 * static analysis requirement for dynamic imports.
 * @type {Object<string, function(): Promise>}
 */
const sectionLoaders = {
  projects: () => import('./projects.js'),
  blog: () => import('./blog.js'),
  contacts: () => import('./contacts.js'),
  resume: () => import('./resume.js'),
};

/**
 * Dynamically load and mount an admin section into the content area.
 * Shows a loading indicator while the chunk is being fetched.
 *
 * @param {string} section - The section ID (key in sectionLoaders)
 */
async function loadSection(section) {
  const content = document.getElementById('admin-content');
  content.innerHTML = '<p class="loading-text">Loading...</p>';

  try {
    const mod = await sectionLoaders[section]();
    mod.default.mount(content);
  } catch (err) {
    content.innerHTML = `<p class="form-status error">Failed to load section: ${err.message}</p>`;
  }
}
