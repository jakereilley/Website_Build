/**
 * InteractionManager.js — Raycaster-based mouse/touch interaction for 3D panels.
 *
 * Handles hit detection between the user's mouse/touch position and the
 * project panels in the 3D gallery. Uses Three.js Raycaster to cast a ray
 * from the camera through the mouse position and check for intersections
 * with registered interactable meshes.
 *
 * Interaction flow:
 *   1. Mouse/touch position is tracked and converted to normalized device
 *      coordinates (NDC: -1 to +1 range)
 *   2. Each frame, update() casts a ray and checks for intersections
 *   3. If a project-panel mesh is hit, its ProjectPanel controller is
 *      notified via setHovered(true) — triggering the glow animation
 *   4. On click/tap, if a panel is hovered, the onSelect callback fires
 *      with the panel's project data
 *
 * Touch support:
 *   On mobile, touchend performs an immediate raycast at the touch position
 *   and triggers selection in one gesture (no separate hover state).
 *
 * The cursor style changes to 'pointer' when hovering over a panel to
 * indicate that it's clickable.
 *
 * @module InteractionManager
 */

import * as THREE from 'three';

export class InteractionManager {
  /**
   * Create a new interaction manager.
   *
   * @param {THREE.PerspectiveCamera} camera - The scene camera (for raycasting)
   * @param {HTMLElement} domElement - The renderer canvas (for mouse/touch events)
   */
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.raycaster = new THREE.Raycaster();

    /** @type {THREE.Vector2} Current mouse position in NDC (-1 to +1) */
    this.mouse = new THREE.Vector2();

    /** @type {THREE.Mesh[]} All meshes registered for raycast hit testing */
    this.interactables = [];

    /** @type {Object|null} Currently hovered panel's userData, or null */
    this.hoveredPanel = null;

    /**
     * Callback fired when a panel is clicked/tapped.
     * Set this to handle panel selection (e.g., open project modal).
     * @type {function(Object): void|null}
     */
    this.onSelect = null;

    this._onMouseMove = this._handleMouseMove.bind(this);
    this._onClick = this._handleClick.bind(this);
    this._onTouchEnd = this._handleTouchEnd.bind(this);

    domElement.addEventListener('mousemove', this._onMouseMove);
    domElement.addEventListener('click', this._onClick);
    domElement.addEventListener('touchend', this._onTouchEnd);
  }

  /**
   * Register meshes for raycast hit testing.
   * Pass the result of ProjectPanel.getMeshes() to make a panel interactive.
   *
   * @param {THREE.Mesh[]} meshes - Meshes to include in raycast checks
   */
  addInteractable(meshes) {
    this.interactables.push(...meshes);
  }

  /**
   * Convert mouse pixel coordinates to normalized device coordinates (NDC).
   * NDC range: X from -1 (left) to +1 (right), Y from -1 (bottom) to +1 (top).
   * @private
   */
  _handleMouseMove(e) {
    const rect = this.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * Handle click — if a panel is currently hovered, fire the onSelect callback.
   * @private
   */
  _handleClick() {
    if (this.hoveredPanel && this.onSelect) {
      this.onSelect(this.hoveredPanel.project);
    }
  }

  /**
   * Handle touch end — performs an immediate raycast at the touch position
   * and triggers selection if a panel is hit. This provides a tap-to-select
   * experience on mobile without requiring a separate hover state.
   * @private
   */
  _handleTouchEnd(e) {
    if (e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const rect = this.domElement.getBoundingClientRect();
      this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

      this._performRaycast();

      if (this.hoveredPanel && this.onSelect) {
        this.onSelect(this.hoveredPanel.project);
      }
    }
  }

  /**
   * Run the raycast check for the current frame.
   * Called from the SceneManager's render loop via onUpdate().
   */
  update() {
    this._performRaycast();
  }

  /**
   * Cast a ray from the camera through the mouse position and check for
   * intersections with registered interactable meshes.
   *
   * Updates hover state on ProjectPanel controllers (triggering glow
   * animations) and changes the cursor style when over a panel.
   * @private
   */
  _performRaycast() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactables, false);

    let newHovered = null;

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hit.userData.type === 'project-panel') {
        newHovered = hit.userData;
        this.domElement.style.cursor = 'pointer';
      }
    }

    if (!newHovered) {
      this.domElement.style.cursor = '';
    }

    // Notify panel controllers of hover state changes
    if (this.hoveredPanel !== newHovered) {
      if (this.hoveredPanel && this.hoveredPanel.controller) {
        this.hoveredPanel.controller.setHovered(false);
      }
      if (newHovered && newHovered.controller) {
        newHovered.controller.setHovered(true);
      }
      this.hoveredPanel = newHovered;
    }
  }

  /**
   * Remove all event listeners and reset cursor.
   * Must be called when leaving the gallery page.
   */
  dispose() {
    this.domElement.removeEventListener('mousemove', this._onMouseMove);
    this.domElement.removeEventListener('click', this._onClick);
    this.domElement.removeEventListener('touchend', this._onTouchEnd);
    this.domElement.style.cursor = '';
  }
}
