/**
 * admin/blog.js — Blog post management CRUD interface.
 *
 * Admin sub-page for creating, editing, and deleting blog posts.
 * Loaded as a code-split chunk by the dashboard.
 *
 * Features:
 *   - Table listing all posts (including drafts) with title, publish status, and date
 *   - "New Post" button to show the create form
 *   - Edit/Delete buttons per row
 *   - Form fields: title, slug, excerpt, content (raw HTML textarea),
 *     tags (comma-separated), published checkbox
 *
 * The content field accepts raw HTML, which is rendered directly on the
 * blog post detail page. A future improvement could add a rich text editor.
 *
 * The admin sees all posts (including unpublished drafts) because the
 * BlogPostViewSet filters by published=True only for non-staff users.
 *
 * API endpoints used:
 *   - GET /api/blog/ — list all posts (admin sees drafts too)
 *   - POST /api/blog/ — create a new post
 *   - PUT /api/blog/:slug/ — update an existing post
 *   - DELETE /api/blog/:slug/ — delete a post
 *
 * @module pages/admin/blog
 */

import { get, post, put, del } from '../../utils/api.js';

export default {
  /**
   * Mount the blog management section into the admin content area.
   * @param {HTMLElement} container - The admin content area element
   */
  async mount(container) {
    container.innerHTML = `
      <div class="admin-section">
        <div class="admin-section-header">
          <h2>Blog Posts</h2>
          <button class="btn btn-primary" id="add-blog-btn">New Post</button>
        </div>
        <div id="blog-list"><p class="loading-text">Loading...</p></div>
        <div id="blog-form-area" style="display:none"></div>
      </div>
    `;

    const listEl = document.getElementById('blog-list');
    const formArea = document.getElementById('blog-form-area');
    let posts = [];

    /** Fetch all blog posts from the API and re-render the table. */
    async function loadPosts() {
      try {
        const data = await get('/blog/');
        posts = data.results || data;
        renderList();
      } catch {
        listEl.innerHTML = '<p class="form-status error">Failed to load posts.</p>';
      }
    }

    /** Render the blog posts table with edit/delete buttons. */
    function renderList() {
      if (posts.length === 0) {
        listEl.innerHTML = '<p class="empty-text">No posts yet.</p>';
        return;
      }

      listEl.innerHTML = `
        <table class="admin-table">
          <thead>
            <tr><th>Title</th><th>Published</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${posts
              .map(
                (p) => `
              <tr>
                <td>${p.title}</td>
                <td>${p.published ? 'Yes' : 'Draft'}</td>
                <td>${new Date(p.created_at).toLocaleDateString()}</td>
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

      listEl.querySelectorAll('.edit-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const p = posts.find((x) => x.slug === btn.dataset.slug);
          showForm(p);
        });
      });

      listEl.querySelectorAll('.delete-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (confirm('Delete this post?')) {
            await del(`/blog/${btn.dataset.slug}/`);
            loadPosts();
          }
        });
      });
    }

    /**
     * Show the create/edit form for a blog post.
     * @param {Object|null} blogPost - Existing post data for editing, or null for create
     */
    function showForm(blogPost = null) {
      formArea.style.display = 'block';
      const isEdit = !!blogPost;

      formArea.innerHTML = `
        <h3>${isEdit ? 'Edit' : 'New'} Post</h3>
        <form id="blog-form" class="contact-form">
          <div class="form-group">
            <label>Title</label>
            <input type="text" name="title" value="${blogPost?.title || ''}" required />
          </div>
          <div class="form-group">
            <label>Slug</label>
            <input type="text" name="slug" value="${blogPost?.slug || ''}" required />
          </div>
          <div class="form-group">
            <label>Excerpt</label>
            <textarea name="excerpt" rows="2">${blogPost?.excerpt || ''}</textarea>
          </div>
          <div class="form-group">
            <label>Content (HTML)</label>
            <textarea name="content" rows="12" required>${blogPost?.content || ''}</textarea>
          </div>
          <div class="form-group">
            <label>Tags (comma-separated)</label>
            <input type="text" name="tags" value="${(blogPost?.tags || []).join(', ')}" />
          </div>
          <div class="form-group">
            <label><input type="checkbox" name="published" ${blogPost?.published ? 'checked' : ''} /> Published</label>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'}</button>
            <button type="button" class="btn btn-outline" id="cancel-blog-form">Cancel</button>
          </div>
          <p class="form-status" id="blog-status"></p>
        </form>
      `;

      document.getElementById('cancel-blog-form').addEventListener('click', () => {
        formArea.style.display = 'none';
      });

      document.getElementById('blog-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const status = document.getElementById('blog-status');

        const data = {
          title: form.title.value.trim(),
          slug: form.slug.value.trim(),
          excerpt: form.excerpt.value.trim(),
          content: form.content.value,
          tags: form.tags.value.split(',').map((t) => t.trim()).filter(Boolean),
          published: form.published.checked,
        };

        try {
          if (isEdit) {
            await put(`/blog/${blogPost.slug}/`, data);
          } else {
            await post('/blog/', data);
          }
          formArea.style.display = 'none';
          loadPosts();
        } catch {
          status.textContent = 'Failed to save.';
          status.className = 'form-status error';
        }
      });
    }

    document.getElementById('add-blog-btn').addEventListener('click', () => showForm());

    loadPosts();
  },
};
