/**
 * HeroBackground.js — Decorative 3D background for the home page hero section.
 *
 * Creates a self-contained Three.js scene with floating, slowly rotating
 * wireframe geometric shapes that react to mouse movement via a parallax
 * effect. The scene renders behind the hero text content.
 *
 * Visual design:
 *   - 5 wireframe shapes (icosahedron, octahedron, tetrahedron, torus,
 *     dodecahedron) in purple with 30% opacity
 *   - Purple ambient light + purple point light for cohesive color
 *   - Shapes rotate continuously at randomized speeds
 *   - Shapes float gently up and down via sine wave motion
 *   - Camera drifts toward the mouse position for parallax depth
 *
 * The renderer uses `alpha: true` for a transparent background so the
 * hero section's CSS gradient shows through. The canvas is positioned
 * absolutely behind the content (z-index: -1) with pointer-events: none
 * so it doesn't interfere with clicking hero text or buttons.
 *
 * This class manages its own scene, camera, renderer, and render loop
 * independently from the gallery's SceneManager. This keeps the hero
 * background lightweight and decoupled.
 *
 * @module HeroBackground
 */

import * as THREE from 'three';

export class HeroBackground {
  /**
   * Create and start the hero background animation.
   *
   * @param {HTMLElement} container - The hero section element to render behind.
   *   The canvas is positioned absolutely within this container.
   */
  constructor(container) {
    this.container = container;

    /** @type {boolean} Set to true by dispose() to stop the render loop */
    this.disposed = false;

    /** @type {number} Mouse X position normalized to -1..+1 range */
    this.mouseX = 0;

    /** @type {number} Mouse Y position normalized to -1..+1 range */
    this.mouseY = 0;

    /** @type {THREE.Mesh[]} All floating shape meshes */
    this.shapes = [];

    // Scene — no background color (transparent via alpha renderer)
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      50
    );
    this.camera.position.z = 12;

    // Alpha-transparent renderer positioned behind hero content
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.zIndex = '-1';
    this.renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(this.renderer.domElement);

    // Purple-tinted lighting
    const ambient = new THREE.AmbientLight(0x4c1d95, 0.5);
    this.scene.add(ambient);
    const point = new THREE.PointLight(0x7c3aed, 1, 30);
    point.position.set(5, 5, 10);
    this.scene.add(point);

    // Create the floating wireframe shapes
    this._createShapes();

    // Track mouse position for parallax effect
    this._onMouseMove = (e) => {
      this.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    // Keep renderer in sync with container size
    this._onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };

    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('resize', this._onResize);

    this.clock = new THREE.Clock();
    this._animate();
  }

  /**
   * Create 5 wireframe geometric shapes at fixed positions with
   * randomized rotation speeds. Each shape gets its own cloned material
   * so they could be independently styled in the future.
   * @private
   */
  _createShapes() {
    const mat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });

    const geometries = [
      new THREE.IcosahedronGeometry(1.5, 1),
      new THREE.OctahedronGeometry(1, 0),
      new THREE.TetrahedronGeometry(0.8, 0),
      new THREE.TorusGeometry(1, 0.3, 8, 16),
      new THREE.DodecahedronGeometry(0.9, 0),
    ];

    const positions = [
      [-5, 2, -3],
      [4, -1, -5],
      [-3, -3, -2],
      [6, 3, -4],
      [0, 0, -6],
    ];

    geometries.forEach((geo, i) => {
      const mesh = new THREE.Mesh(geo, mat.clone());
      mesh.position.set(...positions[i]);
      mesh.userData.speed = 0.2 + Math.random() * 0.3;
      mesh.userData.axis = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();
      this.scene.add(mesh);
      this.shapes.push(mesh);
    });
  }

  /**
   * Render loop — rotates shapes, applies floating motion, moves camera
   * toward mouse position for parallax, then renders.
   * @private
   */
  _animate() {
    if (this.disposed) return;
    requestAnimationFrame(() => this._animate());

    const elapsed = this.clock.getElapsedTime();

    // Rotate and float each shape
    for (const shape of this.shapes) {
      shape.rotation.x += shape.userData.speed * 0.01;
      shape.rotation.y += shape.userData.speed * 0.015;
      shape.position.y += Math.sin(elapsed * shape.userData.speed) * 0.002;
    }

    // Parallax — camera drifts toward mouse position with easing
    this.camera.position.x += (this.mouseX * 0.5 - this.camera.position.x) * 0.05;
    this.camera.position.y += (-this.mouseY * 0.3 - this.camera.position.y) * 0.05;

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Stop the animation and free all GPU resources.
   * Removes event listeners, disposes all geometries and materials,
   * destroys the renderer, and removes the canvas from the DOM.
   * Must be called when navigating away from the home page.
   */
  dispose() {
    this.disposed = true;
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('resize', this._onResize);

    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
