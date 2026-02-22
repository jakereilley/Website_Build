/**
 * projects.js — Immersive 3D gallery page for showcasing projects.
 *
 * This is the centerpiece of the portfolio. It creates a full-screen
 * navigable 3D gallery room where each project is displayed as an
 * interactive panel hung on the walls.
 *
 * Mount sequence:
 *   1. Render the gallery wrapper HTML (canvas container + HUD hint)
 *   2. Fetch projects from the API (falls back to sample data if offline)
 *   3. Create the SceneManager (scene, camera, renderer, render loop)
 *   4. Build the GalleryRoom (floor, walls, ceiling, trim)
 *   5. Set up the LightingSystem (ambient + per-panel spotlights)
 *   6. Create a ProjectPanel for each project, positioned along the walls
 *   7. Initialize the CameraController (WASD movement, pointer lock mouse look)
 *   8. Initialize the InteractionManager (raycaster hover + click detection)
 *   9. Register the per-frame update loop (camera, interaction, panel animations)
 *
 * When a panel is clicked, showProjectModal() opens an HTML overlay with
 * full project details (description, tech tags, links).
 *
 * The HUD hint ("Click to look around...") fades out on first click.
 *
 * Unmount disposes all 3D resources in order: interaction → camera → lighting → scene.
 * This frees the WebGL context and removes all event listeners.
 *
 * Camera starts at position (0, 1.7, 8) — standing height, near the front
 * of the room. Movement is bounded to stay within the room walls.
 *
 * @module pages/projects
 */

import { SceneManager } from '../three/SceneManager.js';
import { CameraController } from '../three/CameraController.js';
import { GalleryRoom } from '../three/GalleryRoom.js';
import { LightingSystem } from '../three/LightingSystem.js';
import { ProjectPanel } from '../three/ProjectPanel.js';
import { InteractionManager } from '../three/InteractionManager.js';
import { showProjectModal } from '../components/project-modal.js';
import { getTheme } from '../utils/theme.js';
import { get } from '../utils/api.js';
import '../styles/modal.css';
import '../styles/gallery.css';

/** @type {SceneManager|null} */
let sceneManager = null;
/** @type {CameraController|null} */
let cameraController = null;
/** @type {InteractionManager|null} */
let interaction = null;
/** @type {LightingSystem|null} */
let lighting = null;
/** @type {ProjectPanel[]} */
let panels = [];

export default {
  /**
   * Mount the 3D gallery: fetch projects, build the scene, start rendering.
   * @param {HTMLElement} container - The router's mount element
   */
  async mount(container) {
    container.innerHTML = `
      <div class="gallery-wrapper">
        <div class="gallery-canvas" id="gallery-canvas"></div>
        <div class="gallery-hud">
          <p class="gallery-hint">Click to look around. Use WASD or arrow keys to move.</p>
        </div>
      </div>
    `;

    const canvasContainer = document.getElementById('gallery-canvas');

    // Fetch projects from the API; fall back to sample data if backend is offline
    let projects = [];
    try {
      const data = await get('/projects/');
      projects = data.results || data;
    } catch {
      projects = [
        { title: 'Sample Project 1', slug: 'sample-1', description: 'A demo project to showcase the gallery.', technologies: ['JavaScript', 'Three.js'], github_url: '', live_url: '' },
        { title: 'Sample Project 2', slug: 'sample-2', description: 'Another demo project with different tech.', technologies: ['Python', 'Django'], github_url: '', live_url: '' },
        { title: 'Sample Project 3', slug: 'sample-3', description: 'A third project for the gallery wall.', technologies: ['React', 'Node.js'], github_url: '', live_url: '' },
      ];
    }

    // Initialize the 3D scene — camera at standing height near room entrance
    sceneManager = new SceneManager(canvasContainer);
    sceneManager.camera.position.set(0, 1.7, 8);

    // Build the gallery room geometry and add to scene
    const room = new GalleryRoom();
    sceneManager.addToScene(room.getGroup());

    // Set up lighting matched to the current theme
    lighting = new LightingSystem(sceneManager.scene);
    lighting.setTheme(getTheme());

    // Create project panels and position them along the walls
    panels = [];
    const positions = room.getPanelPositions(projects.length);

    projects.forEach((project, i) => {
      if (i >= positions.length) return;

      const panel = new ProjectPanel(project);
      const { position, rotation } = positions[i];
      panel.getGroup().position.copy(position);
      panel.getGroup().rotation.copy(rotation);
      sceneManager.addToScene(panel.getGroup());
      panels.push(panel);

      // Add a spotlight aimed at each panel
      lighting.addPanelSpotlight(position);
    });

    // First-person camera controls (WASD + mouse look), bounded to room
    cameraController = new CameraController(
      sceneManager.camera,
      sceneManager.renderer.domElement,
      { minX: -13, maxX: 13, minZ: -8, maxZ: 9 }
    );

    // Raycaster interaction — hover glow + click to open modal
    interaction = new InteractionManager(
      sceneManager.camera,
      sceneManager.renderer.domElement
    );
    for (const panel of panels) {
      interaction.addInteractable(panel.getMeshes());
    }
    interaction.onSelect = (project) => {
      showProjectModal(project);
    };

    // Per-frame update: move camera, check raycasts, animate panel hover effects
    sceneManager.onUpdate((delta) => {
      cameraController.update(delta);
      interaction.update();
      for (const panel of panels) {
        panel.update(delta);
      }
    });

    // Fade out the HUD hint after the user's first click
    canvasContainer.addEventListener('click', () => {
      const hint = container.querySelector('.gallery-hint');
      if (hint) hint.style.opacity = '0';
    }, { once: true });
  },

  /**
   * Unmount: dispose all 3D resources and event listeners.
   * Order matters — interaction and camera first, then lighting, then scene.
   */
  unmount() {
    if (interaction) { interaction.dispose(); interaction = null; }
    if (cameraController) { cameraController.dispose(); cameraController = null; }
    if (lighting) { lighting.dispose(); lighting = null; }
    if (sceneManager) { sceneManager.dispose(); sceneManager = null; }
    panels = [];
  },
};
