/**
 * about.js — About page with bio, skills grid, and resume download.
 *
 * Displays static content (bio paragraphs and categorized skills grid)
 * plus a dynamic resume section that fetches the current resume version
 * from the API and offers a download button.
 *
 * The skills grid is organized into three categories (Frontend, Backend,
 * Tools) using CSS Grid via the .skills-grid class.
 *
 * The resume section asynchronously queries GET /api/resume/ for all
 * resume versions, finds the one with is_current=true, and renders a
 * download link. Falls back to "Resume unavailable." if the API is offline.
 *
 * @module pages/about
 */

import { get } from '../utils/api.js';
import { HeroBackground } from '../three/HeroBackground.js';

/** @type {HeroBackground|null} */
let heroBg = null;

export default {
  /**
   * Mount the about page: render bio, skills, and fetch current resume.
   * @param {HTMLElement} container - The router's mount element
   */
  async mount(container) {
    container.innerHTML = `
      <section class="page">
        <div class="page-bg" id="about-bg"></div>
        <div class="page-content container about-page">
          <h1>About Me</h1>
          <div class="about-content">
            <div class="about-bio">
              <p>I'm a creative developer passionate about building immersive digital experiences. I combine technical expertise with artistic vision to create websites and applications that stand out.</p>
              <p>My toolkit spans full-stack web development, 3D graphics, and interactive design. I believe the best software is both beautiful and functional.</p>
            </div>
            <div class="about-skills">
              <h2>Skills</h2>
              <div class="skills-grid">
                <div class="skill-category">
                  <h3>Frontend</h3>
                  <ul>
                    <li>JavaScript / TypeScript</li>
                    <li>Three.js / WebGL</li>
                    <li>HTML / CSS / GSAP</li>
                  </ul>
                </div>
                <div class="skill-category">
                  <h3>Backend</h3>
                  <ul>
                    <li>Python / Django</li>
                    <li>PostgreSQL</li>
                    <li>REST APIs</li>
                  </ul>
                </div>
                <div class="skill-category">
                  <h3>Tools</h3>
                  <ul>
                    <li>Git / Linux</li>
                    <li>Docker</li>
                    <li>Vite / Webpack</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div class="about-resume" id="resume-section">
            <h2>Resume</h2>
            <p id="resume-status">Loading...</p>
          </div>
        </div>
      </section>
    `;

    heroBg = new HeroBackground(document.getElementById('about-bg'));

    // Fetch the current resume version and show a download button
    const resumeSection = document.getElementById('resume-status');
    try {
      const data = await get('/resume/');
      const resumes = data.results || data;
      const current = resumes.find((r) => r.is_current);
      if (current) {
        resumeSection.innerHTML = `<a href="${current.file}" target="_blank" class="btn btn-primary" download>Download Resume (v${current.version})</a>`;
      } else {
        resumeSection.textContent = 'No resume uploaded yet.';
      }
    } catch {
      resumeSection.textContent = 'Resume unavailable.';
    }
  },

  unmount() {
    if (heroBg) { heroBg.dispose(); heroBg = null; }
  },
};
