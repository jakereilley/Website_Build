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
import { HeroBackground } from '../three/HeroBackground.js';

/** @type {HeroBackground|null} */
let heroBg = null;

export default {
  /**
   * Mount the blog post detail page.
   *
   * @param {HTMLElement} container - The router's mount element
   * @param {Object} params - URL params extracted by the router
   * @param {string} params.slug - The blog post slug from the URL
   */
  async mount(container, params) {
    // Set the full page shell up front so the background starts immediately.
    // Only #post-content is swapped as data loads — avoids destroying the
    // HeroBackground canvas mid-page by replacing container.innerHTML twice.
    container.innerHTML = `
      <section class="page">
        <div class="page-bg" id="blog-post-bg"></div>
        <div class="page-content container blog-post-page" id="post-content">
          <p class="loading-text">Loading post...</p>
        </div>
      </section>
    `;

    heroBg = new HeroBackground(document.getElementById('blog-post-bg'));

    const contentEl = document.getElementById('post-content');

    // Fetch the post by slug from the API
    let post = null;
    try {
      post = await get(`/blog/${params.slug}/`);
    } catch {
      contentEl.innerHTML = `
        <h1>Post not found</h1>
        <a href="#/blog" class="btn btn-outline">Back to Blog</a>
      `;
      return;
    }

    const tags = (post.tags || [])
      .map((t) => `<span class="blog-card-tag">${t}</span>`)
      .join('');

    contentEl.innerHTML = `
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
    `;
  },

  unmount() {
    if (heroBg) { heroBg.dispose(); heroBg = null; }
  },
};
