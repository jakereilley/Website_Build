/**
 * CameraController.js — First-person camera controls for the 3D gallery.
 *
 * Provides a first-person navigation experience similar to a walking tour:
 *   - WASD / Arrow keys to walk forward/backward/strafe
 *   - Mouse look (via Pointer Lock API) to look around
 *   - Touch support: single-finger swipe to look around on mobile
 *
 * Movement is always horizontal (Y position stays fixed) so the user
 * "walks" through the gallery at a consistent height. Direction is
 * relative to where the camera is facing, so W always moves forward.
 *
 * Bounds clamping prevents the camera from passing through walls by
 * restricting X and Z positions to configured min/max values.
 *
 * Vertical look angle is clamped to +/- 60 degrees to prevent the
 * camera from flipping upside down.
 *
 * The Pointer Lock API captures the mouse cursor when the user clicks
 * the canvas. While locked, raw mouse movement data controls the
 * camera's rotation. Pressing Escape exits pointer lock.
 *
 * @module CameraController
 */

import * as THREE from 'three';

export class CameraController {
  /**
   * Create a new camera controller.
   *
   * @param {THREE.PerspectiveCamera} camera - The camera to control
   * @param {HTMLElement} domElement - The renderer's canvas element (for pointer lock + events)
   * @param {Object} [bounds] - Movement boundaries within the gallery room
   * @param {number} [bounds.minX=-15] - Left wall boundary
   * @param {number} [bounds.maxX=15] - Right wall boundary
   * @param {number} [bounds.minZ=-15] - Back wall boundary
   * @param {number} [bounds.maxZ=15] - Front wall boundary
   */
  constructor(camera, domElement, bounds) {
    this.camera = camera;
    this.domElement = domElement;
    this.bounds = bounds || { minX: -15, maxX: 15, minZ: -15, maxZ: 15 };

    /** @type {number} Walking speed in units per second */
    this.moveSpeed = 5;

    /** @type {number} Mouse sensitivity in radians per pixel */
    this.lookSpeed = 0.002;

    /** @type {Object<string, boolean>} Currently pressed keys, keyed by KeyboardEvent.code */
    this.keys = {};

    /**
     * Euler rotation using YXZ order — yaw first (Y), then pitch (X).
     * This prevents gimbal lock during horizontal + vertical look.
     * @type {THREE.Euler}
     */
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ');

    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    /** @type {boolean} Whether the Pointer Lock API is currently active */
    this.isPointerLocked = false;

    // Touch input state (for mobile look-around)
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchMoveActive = false;

    this._bindEvents();
  }

  /**
   * Bind all input event listeners (keyboard, mouse, touch, pointer lock).
   * @private
   */
  _bindEvents() {
    this._onKeyDown = (e) => { this.keys[e.code] = true; };
    this._onKeyUp = (e) => { this.keys[e.code] = false; };
    this._onMouseMove = this._handleMouseMove.bind(this);
    this._onClick = this._handleClick.bind(this);
    this._onPointerLockChange = this._handlePointerLockChange.bind(this);
    this._onTouchStart = this._handleTouchStart.bind(this);
    this._onTouchMove = this._handleTouchMove.bind(this);
    this._onTouchEnd = () => { this.touchMoveActive = false; };

    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('mousemove', this._onMouseMove);
    this.domElement.addEventListener('click', this._onClick);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);
    this.domElement.addEventListener('touchstart', this._onTouchStart, { passive: true });
    this.domElement.addEventListener('touchmove', this._onTouchMove, { passive: true });
    this.domElement.addEventListener('touchend', this._onTouchEnd);
  }

  /**
   * Request pointer lock on canvas click to capture the mouse for camera look.
   * @private
   */
  _handleClick() {
    if (!this.isPointerLocked) {
      this.domElement.requestPointerLock();
    }
  }

  /**
   * Track pointer lock state changes.
   * @private
   */
  _handlePointerLockChange() {
    this.isPointerLocked = document.pointerLockElement === this.domElement;
  }

  /**
   * Handle mouse movement for camera look-around.
   * Only active when pointer is locked. Applies raw movementX/Y deltas
   * to the Euler rotation, with vertical angle clamped to +/- 60 degrees.
   * @private
   */
  _handleMouseMove(e) {
    if (!this.isPointerLocked) return;

    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= e.movementX * this.lookSpeed;
    this.euler.x -= e.movementY * this.lookSpeed;
    this.euler.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.euler.x));
    this.camera.quaternion.setFromEuler(this.euler);
  }

  /**
   * Record the starting touch position for look-around on mobile.
   * @private
   */
  _handleTouchStart(e) {
    if (e.touches.length === 1) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.touchMoveActive = true;
    }
  }

  /**
   * Handle touch drag to rotate the camera (mobile look-around).
   * Computes delta from previous touch position, applies as rotation.
   * @private
   */
  _handleTouchMove(e) {
    if (!this.touchMoveActive || e.touches.length !== 1) return;

    const dx = e.touches[0].clientX - this.touchStartX;
    const dy = e.touches[0].clientY - this.touchStartY;

    this.euler.setFromQuaternion(this.camera.quaternion);
    this.euler.y -= dx * this.lookSpeed;
    this.euler.x -= dy * this.lookSpeed;
    this.euler.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.euler.x));
    this.camera.quaternion.setFromEuler(this.euler);

    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  }

  /**
   * Update camera position based on currently pressed keys.
   * Called once per frame from the SceneManager's render loop.
   *
   * Movement is relative to the camera's facing direction (projected
   * onto the horizontal plane), so W always moves "forward" from the
   * user's perspective. Position is clamped to room bounds after applying.
   *
   * @param {number} delta - Time in seconds since the last frame
   */
  update(delta) {
    const speed = this.moveSpeed * delta;
    this.direction.set(0, 0, 0);

    // Gather input direction from WASD / arrow keys
    if (this.keys['KeyW'] || this.keys['ArrowUp']) this.direction.z -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) this.direction.z += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) this.direction.x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) this.direction.x += 1;

    if (this.direction.length() > 0) {
      this.direction.normalize();
    }

    // Calculate forward and right vectors from camera orientation (horizontal only)
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    // Combine input direction with camera-relative vectors
    this.velocity.set(0, 0, 0);
    this.velocity.addScaledVector(forward, -this.direction.z * speed);
    this.velocity.addScaledVector(right, this.direction.x * speed);

    // Apply movement, then clamp to room boundaries
    this.camera.position.add(this.velocity);
    this.camera.position.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.camera.position.x));
    this.camera.position.z = Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, this.camera.position.z));
  }

  /**
   * Remove all event listeners and release pointer lock.
   * Must be called when leaving the gallery page.
   */
  dispose() {
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('mousemove', this._onMouseMove);
    this.domElement.removeEventListener('click', this._onClick);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    this.domElement.removeEventListener('touchstart', this._onTouchStart);
    this.domElement.removeEventListener('touchmove', this._onTouchMove);
    this.domElement.removeEventListener('touchend', this._onTouchEnd);

    if (document.pointerLockElement === this.domElement) {
      document.exitPointerLock();
    }
  }
}
