/**
 * Vite configuration for the portfolio frontend.
 *
 * Key settings:
 *   - Dev server proxy: Routes /api and /media requests to the Django backend
 *     on port 8000, so the frontend doesn't need to handle CORS during
 *     development. In production, a reverse proxy (e.g., Nginx) would handle this.
 *
 *   - Manual chunks: Three.js (~500KB) and GSAP (~70KB) are split into their
 *     own bundle files. This improves caching — when you change app code,
 *     users don't need to re-download these large libraries.
 */

import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      // Forward API requests to Django during development
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Forward media file requests (project images, resumes) to Django
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Separate large dependencies into their own chunks for better caching
        manualChunks: {
          three: ['three'],
          gsap: ['gsap'],
        },
      },
    },
  },
});
