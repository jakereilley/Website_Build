/**
 * main.js — Application entry point.
 *
 * This is the first JavaScript file loaded by the browser (via index.html).
 * It performs three setup tasks in order:
 *
 *   1. Imports all global CSS stylesheets (themes, layout, page-specific styles)
 *   2. Initializes the theme (light/dark) from localStorage or system preference
 *   3. Mounts the persistent layout components (navbar, footer) and starts the
 *      SPA router, which handles page navigation via hash-based URLs
 *
 * Route Map:
 *   #/              → Home page (hero section with 3D background)
 *   #/projects      → 3D gallery of portfolio projects
 *   #/blog          → Blog listing with search and tag filtering
 *   #/blog/:slug    → Individual blog post detail page
 *   #/about         → About page with skills and resume download
 *   #/contact       → Contact form
 *   #/admin/login   → Admin authentication page
 *   #/admin         → Admin dashboard (protected, requires JWT)
 *   *               → 404 not found page (catch-all)
 */

// --- Global Stylesheets ---
// Imported here so they apply to all pages. Order matters:
// themes.css defines CSS custom properties, global.css uses them.
import './styles/themes.css';
import './styles/global.css';
import './styles/navbar.css';
import './styles/footer.css';
import './styles/hero.css';
import './styles/pages.css';
import './styles/admin.css';
import './styles/toast.css';

// --- Utility Modules ---
import { initTheme } from './utils/theme.js';
import { initRouter } from './utils/router.js';
import { mountNavbar } from './components/navbar.js';
import { mountFooter } from './components/footer.js';

// --- Page Modules ---
// Each page exports { mount(container, params), unmount() }.
// The router calls mount() when navigating to a page and unmount()
// when leaving it (important for cleaning up 3D scenes, event listeners, etc.).
import homePage from './pages/home.js';
import projectsPage from './pages/projects.js';
import blogPage from './pages/blog.js';
import blogPostPage from './pages/blog-post.js';
import aboutPage from './pages/about.js';
import contactPage from './pages/contact.js';
import adminLoginPage from './pages/admin/login.js';
import adminDashboardPage from './pages/admin/dashboard.js';
import notFoundPage from './pages/not-found.js';

// Apply saved theme immediately to prevent a flash of unstyled content
initTheme();

// Mount persistent layout components (these stay visible across all pages)
mountNavbar(document.getElementById('navbar'));
mountFooter(document.getElementById('footer'));

// Define the route map — keys are URL patterns, values are page modules.
// The ':slug' syntax denotes a dynamic parameter (e.g., /blog/my-first-post).
// The '*' key is the fallback for unrecognized URLs.
const routes = {
  '/': homePage,
  '/projects': projectsPage,
  '/blog': blogPage,
  '/blog/:slug': blogPostPage,
  '/about': aboutPage,
  '/contact': contactPage,
  '/admin/login': adminLoginPage,
  '/admin': adminDashboardPage,
  '*': notFoundPage,
};

// The <main> element is the mount point for page content.
// tabindex="-1" allows programmatic focus (for accessibility after navigation).
const mainContent = document.getElementById('main-content');
mainContent.setAttribute('tabindex', '-1');
mainContent.style.outline = 'none';

// Start the router — this reads the current URL hash and mounts the
// corresponding page, then listens for hashchange events.
initRouter(routes, mainContent);
