/**
 * blog-post.js — Single blog post detail page.
 *
 * Fetches a blog post by its slug (from the URL params) and renders
 * the full content including title, author, date, tags, and body HTML.
 *
 * The slug is extracted from the route params by the router's dynamic
 * segment matching (route pattern: '/blog/:slug').
 *
 * If the post is not found (API returns an error), a "Post not found"
 * message is shown with a link back to the blog listing.
 *
 * The post body is rendered as raw HTML (from the API's content field),
 * allowing rich formatting created in the admin blog editor.
 *
 * @module pages/blog-post
 */

import { get } from '../utils/api.js';

export default {
  /**
   * Mount the blog post detail page.
   *
   * @param {HTMLElement} container - The router's mount element
   * @param {Object} params - URL params extracted by the router
   * @param {string} params.slug - The blog post slug from the URL
   */
  async mount(container, params) {
    container.innerHTML = `
      <section class="page">
        <div class="container">
          <p class="loading-text">Loading post...</p>
        </div>
      </section>
    `;

    // Fetch the post by slug from the API
    let post = null;
    try {
      post = await get(`/blog/${params.slug}/`);
    } catch {
      container.innerHTML = `
        <section class="page">
          <div class="container">
            <h1>Post not found</h1>
            <a href="#/blog" class="btn btn-outline">Back to Blog</a>
          </div>
        </section>
      `;
      return;
    }

    const tags = (post.tags || [])
      .map((t) => `<span class="blog-card-tag">${t}</span>`)
      .join('');

    container.innerHTML = `
      <section class="page">
        <div class="container blog-post-page">
          <a href="#/blog" class="back-link">&larr; Back to Blog</a>
          <article class="blog-post-content">
            <h1>${post.title}</h1>
            <div class="blog-post-meta">
              <span>By ${post.author_name || 'Admin'}</span>
              <span>${new Date(post.created_at).toLocaleDateString()}</span>
              ${tags}
            </div>
            <div class="blog-post-body">${post.content}</div>
          </article>
        </div>
      </section>
    `;
  },

  unmount() {},
};
