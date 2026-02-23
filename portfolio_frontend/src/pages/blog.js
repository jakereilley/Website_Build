/**
 * blog.js — Blog listing page with search and tag filtering.
 *
 * Fetches all published blog posts from the API and renders them as
 * clickable cards in a grid layout. Provides two filtering mechanisms:
 *
 *   1. Text search — filters by title and tag names (case-insensitive)
 *   2. Tag chips — toggle a tag to show only posts with that tag
 *
 * Both filters work together (intersection). Filtering is client-side
 * since all posts are fetched at once.
 *
 * Clicking a blog card navigates to #/blog/:slug via the SPA router,
 * which loads the blog-post.js detail page.
 *
 * Tags are extracted from all posts using a Set to deduplicate, then
 * rendered as clickable chip buttons. Clicking a chip toggles it — click
 * again to deselect.
 *
 * @module pages/blog
 */

import { get } from '../utils/api.js';
import { navigate } from '../utils/router.js';
import { HeroBackground } from '../three/HeroBackground.js';

/** @type {HeroBackground|null} */
let heroBg = null;

export default {
  /**
   * Mount the blog listing: fetch posts, render cards, set up filtering.
   * @param {HTMLElement} container - The router's mount element
   */
  async mount(container) {
    container.innerHTML = `
      <section class="page">
        <div class="page-bg" id="blog-bg"></div>
        <div class="page-content container">
          <h1>Blog</h1>
          <div class="blog-controls">
            <input type="text" class="blog-search" placeholder="Search posts..." aria-label="Search blog posts" />
            <div class="blog-tags" id="blog-tags"></div>
          </div>
          <div class="blog-grid" id="blog-grid">
            <p class="loading-text">Loading posts...</p>
          </div>
        </div>
      </section>
    `;

    heroBg = new HeroBackground(document.getElementById('blog-bg'));

    // Fetch all published blog posts
    let posts = [];
    try {
      const data = await get('/blog/');
      posts = data.results || data;
    } catch {
      posts = [];
    }

    const grid = document.getElementById('blog-grid');
    const tagsContainer = document.getElementById('blog-tags');
    const searchInput = container.querySelector('.blog-search');

    // Extract all unique tags across all posts for the tag filter chips
    const allTags = [...new Set(posts.flatMap((p) => p.tags || []))];

    if (allTags.length > 0) {
      tagsContainer.innerHTML = allTags
        .map((tag) => `<button class="tag-chip" data-tag="${tag}">${tag}</button>`)
        .join('');
    }

    /** @type {string|null} Currently active tag filter, or null for all */
    let activeTag = null;

    /**
     * Render blog cards filtered by search text and/or active tag.
     * Both filters must match (intersection) for a post to appear.
     *
     * @param {string} filter - Search text to match against title/tags
     * @param {string|null} tag - Active tag to filter by, or null for all
     */
    function renderPosts(filter = '', tag = null) {
      const filtered = posts.filter((p) => {
        const matchSearch = !filter ||
          p.title.toLowerCase().includes(filter.toLowerCase()) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(filter.toLowerCase()));
        const matchTag = !tag || (p.tags || []).includes(tag);
        return matchSearch && matchTag;
      });

      if (filtered.length === 0) {
        grid.innerHTML = '<p class="empty-text">No posts found.</p>';
        return;
      }

      grid.innerHTML = filtered
        .map(
          (post) => `
        <article class="blog-card" data-slug="${post.slug}">
          <h2 class="blog-card-title">${post.title}</h2>
          <p class="blog-card-excerpt">${post.excerpt || post.content.slice(0, 150) + '...'}</p>
          <div class="blog-card-meta">
            <span>${new Date(post.created_at).toLocaleDateString()}</span>
            ${(post.tags || []).map((t) => `<span class="blog-card-tag">${t}</span>`).join('')}
          </div>
        </article>
      `
        )
        .join('');

      // Make each card clickable → navigate to post detail page
      grid.querySelectorAll('.blog-card').forEach((card) => {
        card.addEventListener('click', () => {
          navigate(`/blog/${card.dataset.slug}`);
        });
        card.style.cursor = 'pointer';
      });
    }

    // Initial render with all posts
    renderPosts();

    // Live search filtering on input
    searchInput.addEventListener('input', (e) => {
      renderPosts(e.target.value, activeTag);
    });

    // Tag chip click — toggle active tag filter
    tagsContainer.addEventListener('click', (e) => {
      if (e.target.classList.contains('tag-chip')) {
        const tag = e.target.dataset.tag;
        activeTag = activeTag === tag ? null : tag;

        tagsContainer.querySelectorAll('.tag-chip').forEach((chip) => {
          chip.classList.toggle('active', chip.dataset.tag === activeTag);
        });

        renderPosts(searchInput.value, activeTag);
      }
    });
  },

  unmount() {
    if (heroBg) { heroBg.dispose(); heroBg = null; }
  },
};
