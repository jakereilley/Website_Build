/**
 * SceneManager.js — Core Three.js scene lifecycle manager.
 *
 * Owns the fundamental Three.js objects (Scene, PerspectiveCamera, WebGLRenderer)
 * and manages the render loop. All other 3D modules (GalleryRoom, ProjectPanel,
 * LightingSystem, etc.) add their objects into this manager's scene.
 *
 * Lifecycle:
 *   1. Constructor creates the scene, camera, renderer, and starts the render loop
 *   2. Other modules call addToScene() to place objects and onUpdate() to register
 *      per-frame callbacks
 *   3. The render loop calls all registered update callbacks with (delta, elapsed),
 *      then renders the scene
 *   4. dispose() stops the loop, frees all GPU resources (geometries, materials),
 *      destroys the renderer, and removes the canvas from the DOM
 *
 * The renderer uses ACES Filmic tone mapping for cinematic color, and caps the
 * pixel ratio at 2 to balance quality and performance on high-DPI displays.
 *
 * @module SceneManager
 */

import * as THREE from 'three';

export class SceneManager {
  /**
   * Create a new SceneManager and append its canvas to the given container.
   *
   * @param {HTMLElement} container - The DOM element to render into.
   *   The canvas will fill this element's dimensions.
   */
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.clock = new THREE.Clock();

    /** @type {Array<function(number, number): void>} Per-frame update callbacks */
    this.updateCallbacks = [];

    /** @type {boolean} Set to true by dispose() to stop the render loop */
    this.disposed = false;

    // Camera — 60° FOV, near=0.1, far=100
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );

    // Renderer — high-performance WebGL with ACES tone mapping
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    // Keep renderer in sync with container size changes
    this._onResize = this._handleResize.bind(this);
    window.addEventListener('resize', this._onResize);

    // Start the render loop
    this._animate();
  }

  /**
   * Add a Three.js object (mesh, group, light, etc.) to the scene.
   * @param {THREE.Object3D} object - The object to add
   */
  addToScene(object) {
    this.scene.add(object);
  }

  /**
   * Remove an object from the scene.
   * @param {THREE.Object3D} object - The object to remove
   */
  removeFromScene(object) {
    this.scene.remove(object);
  }

  /**
   * Register a callback to be called every frame during the render loop.
   * Callbacks receive delta time (seconds since last frame) and elapsed
   * time (seconds since the clock started).
   *
   * @param {function(number, number): void} callback - Called as callback(delta, elapsed)
   */
  onUpdate(callback) {
    this.updateCallbacks.push(callback);
  }

  /**
   * Internal render loop. Runs via requestAnimationFrame until disposed.
   * Each frame: computes delta/elapsed time, runs all update callbacks,
   * then renders the scene.
   * @private
   */
  _animate() {
    if (this.disposed) return;

    requestAnimationFrame(() => this._animate());

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    for (const cb of this.updateCallbacks) {
      cb(delta, elapsed);
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle window resize by updating camera aspect ratio and renderer size.
   * @private
   */
  _handleResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  /**
   * Clean up all GPU resources and remove the canvas from the DOM.
   *
   * Traverses the entire scene graph and disposes every geometry and material
   * to prevent WebGL memory leaks. Also removes the resize listener and
   * stops the render loop by setting `this.disposed = true`.
   *
   * Must be called when navigating away from the gallery page.
   */
  dispose() {
    this.disposed = true;
    window.removeEventListener('resize', this._onResize);

    // Walk the scene graph and free all GPU-allocated resources
    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
