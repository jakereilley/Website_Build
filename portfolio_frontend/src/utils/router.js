/**
 * router.js — Hash-based SPA router with GSAP page transitions.
 *
 * This module provides client-side routing without a framework. It uses
 * the URL hash (e.g., #/projects, #/blog/my-post) to determine which
 * page to display.
 *
 * How it works:
 *   1. initRouter() registers a route map and listens for 'hashchange' events
 *   2. When the hash changes, handleRoute() matches the new hash against
 *      registered patterns (including dynamic params like :slug)
 *   3. The current page's unmount() is called (cleanup), then the new page's
 *      mount(container, params) is called
 *   4. GSAP animates a fade+slide transition between pages
 *
 * Page Module Contract:
 *   Each page must export: { mount(container, params), unmount() }
 *   - mount() receives the DOM container to render into and any URL params
 *   - unmount() should clean up event listeners, 3D scenes, timers, etc.
 *
 * @module router
 */

import gsap from 'gsap';

/** @type {Object|null} The currently mounted page module */
let currentPage = null;

/** @type {Object<string, Object>} Map of route patterns to page modules */
let routes = {};

/** @type {HTMLElement|null} The DOM element where pages are mounted */
let container = null;

/** @type {boolean} Prevents overlapping transitions */
let isTransitioning = false;

/**
 * Initialize the router with a route map and mount element.
 * Immediately navigates to the current URL hash.
 *
 * @param {Object<string, Object>} routeMap - Maps URL patterns to page modules
 *   Example: { '/': homePage, '/blog/:slug': blogPostPage, '*': notFoundPage }
 * @param {HTMLElement} mountElement - The DOM element to mount pages into
 */
export function initRouter(routeMap, mountElement) {
  routes = routeMap;
  container = mountElement;

  window.addEventListener('hashchange', () => handleRoute());
  handleRoute();
}

/**
 * Programmatically navigate to a route.
 * Triggers a hashchange event, which the router handles.
 *
 * @param {string} path - The route path (e.g., '/projects', '/blog/my-post')
 */
export function navigate(path) {
  window.location.hash = path;
}

/**
 * Get the current route path from the URL hash.
 *
 * @returns {string} The current path (e.g., '/blog/my-post'), defaults to '/'
 */
export function getRoute() {
  const hash = window.location.hash.slice(1) || '/';
  return hash;
}

/**
 * Handle a route change: match the URL, transition pages, and mount the new page.
 * Uses GSAP for a smooth fade+slide transition between pages.
 */
async function handleRoute() {
  if (isTransitioning) return;

  const path = getRoute();

  // Try to match the current path against registered route patterns.
  // The '*' wildcard is skipped here — it's used as a fallback below.
  let page = null;
  let params = {};

  for (const [pattern, handler] of Object.entries(routes)) {
    if (pattern === '*') continue;
    const match = matchRoute(pattern, path);
    if (match) {
      page = handler;
      params = match;
      break;
    }
  }

  // Fall back to the wildcard route (404 page) or home page
  if (!page) {
    page = routes['*'] || routes['/'];
  }

  // Animate out the current page (fade out + slight upward slide)
  if (currentPage) {
    isTransitioning = true;
    await gsap.to(container, { opacity: 0, y: 8, duration: 0.15, ease: 'power2.in' });

    if (currentPage.unmount) {
      currentPage.unmount();
    }
  }

  // Clear the container and mount the new page
  container.innerHTML = '';
  currentPage = page;

  if (page && page.mount) {
    page.mount(container, params);
  }

  // Animate in the new page (fade in + slide down into place)
  gsap.fromTo(
    container,
    { opacity: 0, y: 8 },
    { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out', onComplete: () => { isTransitioning = false; } }
  );

  // Move focus to the main content area for screen readers
  container.focus({ preventScroll: true });

  window.scrollTo(0, 0);
}

/**
 * Match a route pattern against a URL path.
 * Supports dynamic segments prefixed with ':' (e.g., '/blog/:slug').
 *
 * @param {string} pattern - Route pattern (e.g., '/blog/:slug')
 * @param {string} path - Actual URL path (e.g., '/blog/my-first-post')
 * @returns {Object|null} Extracted params (e.g., { slug: 'my-first-post' }), or null if no match
 */
function matchRoute(pattern, path) {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');

  // Patterns must have the same number of segments to match
  if (patternParts.length !== pathParts.length) return null;

  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      // Dynamic segment — extract the value as a named parameter
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      // Static segment doesn't match
      return null;
    }
  }

  return params;
}
