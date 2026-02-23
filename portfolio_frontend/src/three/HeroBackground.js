/**
 * HeroBackground.js — Depth-layered Matrix number stream.
 *
 * Three transparent planes live at different Z depths in a Three.js scene.
 * Each plane has its own offscreen canvas running a Matrix rain simulation
 * and uploads it as a CanvasTexture every frame. Perspective makes the back
 * planes' characters appear smaller, and their slower speed + lower opacity
 * reinforces the sense of depth — all without any camera movement.
 *
 * Mouse avoidance is handled in normalised screen space so the void radius
 * looks consistent across every depth layer.
 *
 * @module HeroBackground
 */

import * as THREE from 'three';

// ─── Constants ────────────────────────────────────────────────────────────────

const CAMERA_Z   = 20;   // camera sits at z=20, looking toward -Z
const FOV        = 60;   // degrees — used to size planes to exactly fill viewport
const CANVAS_W   = 1024; // offscreen canvas width  (all layers share the same resolution)
const CANVAS_H   = 576;  // offscreen canvas height (16:9 — acceptable for most screens)
const FONT_SIZE  = 14;   // canvas px — character height / row height
const COL_GAP    = 16;   // canvas px — column pitch
const TRAIL      = 22;   // characters per stream (head + fading tail)
const DIGITS     = '0123456789';

// Void radius in normalised screen units [0..1].
// 0.12 ≈ 12% of screen half-width — same apparent size on every layer.
const AVOID_NDC  = 0.12;

// Layer definitions: back → front so Three.js renders them in the right order
const LAYER_DEFS = [
  { z: -14, opacity: 0.35, speedMult: 0.35 }, // back  — dim, slow
  { z:  -7, opacity: 0.60, speedMult: 0.65 }, // mid   — medium
  { z:   0, opacity: 0.90, speedMult: 1.00 }, // front — bright, fast
];

// ─── Class ────────────────────────────────────────────────────────────────────

export class HeroBackground {
  /**
   * @param {HTMLElement} container - Hero section element. The WebGL canvas is
   *   positioned absolutely inside it, behind the text content.
   */
  constructor(container) {
    this.container  = container;
    this.disposed   = false;
    this.mouseX     = 0;   // normalised [-1, +1], left → right
    this.mouseY     = 0;   // normalised [-1, +1], top  → bottom
    this.mouseMoved = false;

    // ── Three.js boilerplate ──────────────────────────────────────────────────
    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      FOV,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    this.camera.position.z = CAMERA_Z;

    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    Object.assign(this.renderer.domElement.style, {
      position:      'absolute',
      top:           '0',
      left:          '0',
      zIndex:        '-1',
      pointerEvents: 'none',
    });
    container.appendChild(this.renderer.domElement);

    // ── Depth layers ─────────────────────────────────────────────────────────
    const aspect  = container.clientWidth / container.clientHeight;
    this._layers  = LAYER_DEFS.map(def => this._buildLayer(def, aspect));

    // ── Theme observer ────────────────────────────────────────────────────────
    // Colors are read dynamically each frame — observer just invalidates caches.
    this._themeObserver = new MutationObserver(() => {});
    this._themeObserver.observe(document.documentElement, {
      attributes:      true,
      attributeFilter: ['data-theme'],
    });

    // ── Event listeners ───────────────────────────────────────────────────────
    this._onMouseMove = (e) => {
      this.mouseX     = (e.clientX / window.innerWidth  - 0.5) * 2;
      this.mouseY     = (e.clientY / window.innerHeight - 0.5) * 2;
      this.mouseMoved = true;
    };

    this._onResize = () => {
      const w  = container.clientWidth;
      const h  = container.clientHeight;
      const ar = w / h;
      this.camera.aspect = ar;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      for (const layer of this._layers) this._resizePlane(layer, ar);
    };

    window.addEventListener('mousemove', this._onMouseMove);
    window.addEventListener('resize',    this._onResize);

    this._animate();
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /** @private */
  _isDarkMode() {
    return document.documentElement.dataset.theme === 'dark';
  }

  /** @private */
  _randDigit() {
    return DIGITS[Math.floor(Math.random() * DIGITS.length)];
  }

  /**
   * Compute the mouse position in offscreen canvas pixel coordinates.
   * Because every layer is sized to fill the viewport, screen-space NDC maps
   * identically to canvas UV on every layer — no raycasting needed.
   *
   *   mouseX ∈ [-1,+1] left→right  →  canvasX ∈ [0, CANVAS_W]
   *   mouseY ∈ [-1,+1] top→bottom  →  canvasY ∈ [0, CANVAS_H]
   *
   * Returns null if the mouse hasn't moved yet.
   * @private
   */
  _mouseCanvasCoords() {
    if (!this.mouseMoved) return null;
    return {
      x: (this.mouseX + 1) * 0.5 * CANVAS_W,
      y: (this.mouseY + 1) * 0.5 * CANVAS_H,
      r: AVOID_NDC * CANVAS_W,  // void radius in canvas pixels
    };
  }

  // ── Layer construction ──────────────────────────────────────────────────────

  /**
   * Build one depth layer:
   *   - An offscreen canvas for the rain simulation
   *   - A CanvasTexture uploaded to a PlaneGeometry each frame
   *   - Rain column state (head position, speed, character buffer)
   *
   * The plane is sized so it exactly fills the viewport at its Z depth,
   * using the camera's FOV. This ensures all layers cover the full screen
   * while perspective naturally makes far-layer characters appear smaller.
   * @private
   */
  _buildLayer({ z, opacity, speedMult }, aspect) {
    // World-space size that fills the viewport at this Z depth
    const dist   = CAMERA_Z - z;
    const halfH  = Math.tan((FOV / 2) * (Math.PI / 180)) * dist;
    const planeH = halfH * 2;
    const planeW = planeH * aspect;

    // Offscreen canvas — Three.js reads it as a texture
    const canvas = document.createElement('canvas');
    canvas.width  = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d');

    // CanvasTexture with default flipY=true so canvas y=0 appears at screen top
    const texture = new THREE.CanvasTexture(canvas);

    const geo = new THREE.PlaneGeometry(planeW, planeH);
    const mat = new THREE.MeshBasicMaterial({
      map:         texture,
      transparent: true,
      opacity,
      depthWrite:  false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = z;
    this.scene.add(mesh);

    // Rain column state
    const numCols = Math.floor(CANVAS_W / COL_GAP);
    const columns = Array.from({ length: numCols }, (_, i) => ({
      x:       i * COL_GAP + COL_GAP / 2,
      head:    -Math.floor(Math.random() * 40), // staggered start above screen
      lastRow: -Infinity,
      speed:   (0.15 + Math.random() * 0.3) * speedMult,
      chars:   Array.from({ length: TRAIL }, () => this._randDigit()),
    }));

    return { canvas, ctx, texture, mesh, columns, planeW, planeH };
  }

  /**
   * Rebuild the plane geometry when the container is resized.
   * Only the geometry changes — the canvas texture and column state are reused.
   * @private
   */
  _resizePlane(layer, aspect) {
    const z      = layer.mesh.position.z;
    const dist   = CAMERA_Z - z;
    const halfH  = Math.tan((FOV / 2) * (Math.PI / 180)) * dist;
    const planeH = halfH * 2;
    const planeW = planeH * aspect;
    layer.mesh.geometry.dispose();
    layer.mesh.geometry = new THREE.PlaneGeometry(planeW, planeH);
    layer.planeW = planeW;
    layer.planeH = planeH;
  }

  // ── Rain simulation ─────────────────────────────────────────────────────────

  /**
   * Simulate and redraw one frame of Matrix rain onto a layer's offscreen canvas.
   * The canvas is cleared each frame (transparent background) so the hero
   * section's CSS gradient shows through behind the streams.
   * @private
   */
  _updateLayer(layer, mouse) {
    const { ctx, columns } = layer;
    const dark        = this._isDarkMode();
    const headColor   = dark ? '#f0e8ff' : '#3b0764'; // bright head character
    const streamColor = dark ? '#a78bfa' : '#7c3aed'; // fading trail

    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.font      = `${FONT_SIZE}px "Courier New", monospace`;
    ctx.textAlign = 'center';

    for (const col of columns) {
      // Advance head and push a new digit when crossing a row boundary
      col.head += col.speed;
      const headRow = Math.floor(col.head);
      if (headRow > col.lastRow) {
        col.lastRow = headRow;
        col.chars.unshift(this._randDigit());
        col.chars.length = TRAIL; // truncate to fixed length
      }

      // Randomly mutate one trail character per frame — classic Matrix glitch
      const flickIdx = 1 + Math.floor(Math.random() * (TRAIL - 1));
      col.chars[flickIdx] = this._randDigit();

      // Draw each character in the trail, index 0 = head
      for (let t = 0; t < TRAIL; t++) {
        const y = (headRow - t) * FONT_SIZE;
        if (y < -FONT_SIZE || y > CANVAS_H) continue;

        // Base opacity: head is full, trail fades to zero
        const base = t === 0 ? 1.0 : (1 - t / TRAIL) * 0.9;

        // Mouse avoidance — quadratic falloff within the void radius
        let avoid = 1;
        if (mouse) {
          const dx   = col.x - mouse.x;
          const dy   = y     - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.r) {
            const tt = dist / mouse.r;
            avoid = tt * tt;
          }
        }

        const opacity = base * avoid;
        if (opacity < 0.02) continue;

        ctx.globalAlpha = opacity;
        ctx.fillStyle   = t === 0 ? headColor : streamColor;
        ctx.fillText(col.chars[t], col.x, y);
      }

      // Reset the column above the top when it scrolls off the bottom
      if (col.head * FONT_SIZE > CANVAS_H + TRAIL * FONT_SIZE) {
        col.head    = -Math.floor(Math.random() * 25);
        col.lastRow = -Infinity;
        col.chars   = Array.from({ length: TRAIL }, () => this._randDigit());
      }
    }

    ctx.globalAlpha = 1;
    layer.texture.needsUpdate = true;
  }

  // ── Render loop ─────────────────────────────────────────────────────────────

  /** @private */
  _animate() {
    if (this.disposed) return;
    requestAnimationFrame(() => this._animate());

    const mouse = this._mouseCanvasCoords();
    for (const layer of this._layers) this._updateLayer(layer, mouse);
    this.renderer.render(this.scene, this.camera);
  }

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  /**
   * Stop the animation loop and free all GPU resources.
   * Must be called when navigating away from the home page.
   */
  dispose() {
    this.disposed = true;
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('resize',    this._onResize);
    this._themeObserver.disconnect();

    for (const layer of this._layers) {
      layer.texture.dispose();
      layer.mesh.geometry.dispose();
      layer.mesh.material.dispose();
      // Release the offscreen canvas memory
      layer.canvas.width = 0;
    }

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
