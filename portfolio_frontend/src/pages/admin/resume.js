/**
 * admin/resume.js — Resume upload and version history management.
 *
 * Admin sub-page for uploading new resume files and viewing the
 * version history. Loaded as a code-split chunk by the dashboard.
 *
 * Features:
 *   - File upload form (accepts .pdf, .doc, .docx)
 *   - Auto-increments version number based on existing resume count
 *   - New uploads are automatically marked as is_current=true
 *     (the backend's Resume.save() auto-deactivates previous versions)
 *   - Version history table with download links for each version
 *   - "Active" indicator for the current version
 *
 * The upload uses FormData (not JSON) since it includes a file.
 * The API client detects FormData and omits the Content-Type header
 * so the browser can set the multipart boundary automatically.
 *
 * API endpoints used:
 *   - GET /api/resume/ — list all resume versions
 *   - POST /api/resume/ — upload a new resume
 *
 * @module pages/admin/resume
 */

import { get, post } from '../../utils/api.js';

export default {
  /**
   * Mount the resume management section into the admin content area.
   * @param {HTMLElement} container - The admin content area element
   */
  async mount(container) {
    container.innerHTML = `
      <div class="admin-section">
        <h2>Resume Management</h2>
        <div id="resume-upload">
          <form id="resume-form" class="contact-form">
            <div class="form-group">
              <label for="resume-file">Upload New Resume</label>
              <input type="file" id="resume-file" accept=".pdf,.doc,.docx" required />
            </div>
            <button type="submit" class="btn btn-primary">Upload</button>
            <p class="form-status" id="resume-status"></p>
          </form>
        </div>
        <div id="resume-history">
          <h3>Version History</h3>
          <div id="resume-list"><p class="loading-text">Loading...</p></div>
        </div>
      </div>
    `;

    const listEl = document.getElementById('resume-list');

    /** Fetch all resume versions and render the history table. */
    async function loadResumes() {
      try {
        const data = await get('/resume/');
        const resumes = data.results || data;

        if (resumes.length === 0) {
          listEl.innerHTML = '<p class="empty-text">No resumes uploaded yet.</p>';
          return;
        }

        listEl.innerHTML = `
          <table class="admin-table">
            <thead>
              <tr><th>Version</th><th>Uploaded</th><th>Current</th><th>File</th></tr>
            </thead>
            <tbody>
              ${resumes
                .map(
                  (r) => `
                <tr>
                  <td>v${r.version}</td>
                  <td>${new Date(r.uploaded_at).toLocaleDateString()}</td>
                  <td>${r.is_current ? 'Active' : ''}</td>
                  <td><a href="${r.file}" target="_blank" class="btn-small">Download</a></td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        `;
      } catch {
        listEl.innerHTML = '<p class="form-status error">Failed to load resumes.</p>';
      }
    }

    // Handle resume file upload
    document.getElementById('resume-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const status = document.getElementById('resume-status');
      const fileInput = document.getElementById('resume-file');
      const file = fileInput.files[0];
      if (!file) return;

      // Build FormData for multipart file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('is_current', 'true');

      // Auto-increment version based on existing count
      try {
        const data = await get('/resume/');
        const resumes = data.results || data;
        formData.append('version', resumes.length + 1);
      } catch {
        formData.append('version', 1);
      }

      try {
        await post('/resume/', formData);
        status.textContent = 'Resume uploaded!';
        status.className = 'form-status success';
        fileInput.value = '';
        loadResumes();
      } catch {
        status.textContent = 'Upload failed.';
        status.className = 'form-status error';
      }
    });

    loadResumes();
  },
};
