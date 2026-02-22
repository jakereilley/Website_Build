/**
 * admin/projects.js — Project management CRUD interface.
 *
 * Admin sub-page for creating, editing, and deleting projects.
 * Loaded as a code-split chunk by the dashboard when the "Projects"
 * sidebar button is clicked.
 *
 * Features:
 *   - Table listing all projects with title, featured status, and order
 *   - "Add Project" button to show the create form
 *   - Edit button per row to populate the form with existing data
 *   - Delete button per row with confirmation prompt
 *   - Form fields: title, slug, description, technologies (comma-separated),
 *     GitHub URL, live URL, display order, featured checkbox
 *
 * API endpoints used:
 *   - GET /api/projects/ — list all projects
 *   - POST /api/projects/ — create a new project
 *   - PUT /api/projects/:slug/ — update an existing project
 *   - DELETE /api/projects/:slug/ — delete a project
 *
 * Technologies are stored as a JSON array in the backend. The form
 * accepts a comma-separated string and converts it to an array before
 * sending to the API.
 *
 * @module pages/admin/projects
 */

import { get, post, put, del } from '../../utils/api.js';

export default {
  /**
   * Mount the project management section into the admin content area.
   * @param {HTMLElement} container - The admin content area element
   */
  async mount(container) {
    container.innerHTML = `
      <div class="admin-section">
        <div class="admin-section-header">
          <h2>Projects</h2>
          <button class="btn btn-primary" id="add-project-btn">Add Project</button>
        </div>
        <div id="projects-list"><p class="loading-text">Loading...</p></div>
        <div id="project-form-area" style="display:none"></div>
      </div>
    `;

    const listEl = document.getElementById('projects-list');
    const formArea = document.getElementById('project-form-area');
    let projects = [];

    /** Fetch all projects from the API and re-render the table. */
    async function loadProjects() {
      try {
        const data = await get('/projects/');
        projects = data.results || data;
        renderList();
      } catch {
        listEl.innerHTML = '<p class="form-status error">Failed to load projects.</p>';
      }
    }

    /** Render the project table with edit/delete buttons per row. */
    function renderList() {
      if (projects.length === 0) {
        listEl.innerHTML = '<p class="empty-text">No projects yet.</p>';
        return;
      }

      listEl.innerHTML = `
        <table class="admin-table">
          <thead>
            <tr><th>Title</th><th>Featured</th><th>Order</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${projects
              .map(
                (p) => `
              <tr>
                <td>${p.title}</td>
                <td>${p.featured ? 'Yes' : 'No'}</td>
                <td>${p.order}</td>
                <td class="admin-actions">
                  <button class="btn-small edit-btn" data-slug="${p.slug}">Edit</button>
                  <button class="btn-small delete-btn" data-slug="${p.slug}">Delete</button>
                </td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      `;

      // Edit button → populate form with existing project data
      listEl.querySelectorAll('.edit-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const project = projects.find((p) => p.slug === btn.dataset.slug);
          showForm(project);
        });
      });

      // Delete button → confirm and send DELETE request
      listEl.querySelectorAll('.delete-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (confirm('Delete this project?')) {
            await del(`/projects/${btn.dataset.slug}/`);
            loadProjects();
          }
        });
      });
    }

    /**
     * Show the create/edit form. If a project is provided, the form
     * is pre-populated for editing; otherwise it's a blank create form.
     *
     * @param {Object|null} project - Existing project data for editing, or null for create
     */
    function showForm(project = null) {
      formArea.style.display = 'block';
      const isEdit = !!project;

      formArea.innerHTML = `
        <h3>${isEdit ? 'Edit' : 'New'} Project</h3>
        <form id="project-form" class="contact-form">
          <div class="form-group">
            <label>Title</label>
            <input type="text" name="title" value="${project?.title || ''}" required />
          </div>
          <div class="form-group">
            <label>Slug</label>
            <input type="text" name="slug" value="${project?.slug || ''}" required />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea name="description" rows="4" required>${project?.description || ''}</textarea>
          </div>
          <div class="form-group">
            <label>Technologies (comma-separated)</label>
            <input type="text" name="technologies" value="${(project?.technologies || []).join(', ')}" />
          </div>
          <div class="form-group">
            <label>GitHub URL</label>
            <input type="url" name="github_url" value="${project?.github_url || ''}" />
          </div>
          <div class="form-group">
            <label>Live URL</label>
            <input type="url" name="live_url" value="${project?.live_url || ''}" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Order</label>
              <input type="number" name="order" value="${project?.order || 0}" />
            </div>
            <div class="form-group">
              <label><input type="checkbox" name="featured" ${project?.featured ? 'checked' : ''} /> Featured</label>
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'}</button>
            <button type="button" class="btn btn-outline" id="cancel-form">Cancel</button>
          </div>
          <p class="form-status" id="project-status"></p>
        </form>
      `;

      document.getElementById('cancel-form').addEventListener('click', () => {
        formArea.style.display = 'none';
      });

      // Handle form submission — create or update based on isEdit flag
      document.getElementById('project-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const status = document.getElementById('project-status');

        const data = {
          title: form.title.value.trim(),
          slug: form.slug.value.trim(),
          description: form.description.value.trim(),
          technologies: form.technologies.value.split(',').map((t) => t.trim()).filter(Boolean),
          github_url: form.github_url.value.trim(),
          live_url: form.live_url.value.trim(),
          order: parseInt(form.order.value) || 0,
          featured: form.featured.checked,
        };

        try {
          if (isEdit) {
            await put(`/projects/${project.slug}/`, data);
          } else {
            await post('/projects/', data);
          }
          formArea.style.display = 'none';
          loadProjects();
        } catch (err) {
          status.textContent = 'Failed to save.';
          status.className = 'form-status error';
        }
      });
    }

    document.getElementById('add-project-btn').addEventListener('click', () => showForm());

    loadProjects();
  },
};
