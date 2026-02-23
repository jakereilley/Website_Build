/**
 * HeroBackground.js — Particle constellation field for the home page hero section.
 *
 * Creates a self-contained Three.js scene with:
 *   - ~180 particles drifting slowly through 3D space
 *   - Proximity-based connection lines between nearby particles
 *   - Depth fog: lines further from the camera are encoded dimmer via vertex colors,
 *     giving an atmospheric depth effect without THREE.Fog (which requires a
 *     background color and conflicts with the alpha-transparent canvas)
 *   - Camera parallax that follows the mouse for a reactive, techy feel
 *   - Theme-aware colors (dark/light mode via MutationObserver)
 *
 * @module HeroBackground
 */

import * as THREE from 'three';

/** Total number of floating particles */
const PARTICLE_COUNT = 180;

/** Max XY distance at which two particles draw a connecting line */
const CONNECTION_DISTANCE = 4.0;

/**
 * Pre-allocated line segment buffer size.
 * Each line segment needs 2 vertices × 3 floats = 6 floats.
 * 700 lines is well above the typical ~200-300 active at any time.
 */
const MAX_LINES = 700;

export class HeroBackground {
  /**
   * @param {HTMLElement} container - Hero section element. Canvas is positioned
   *   absolutely inside it, behind the text content.
   */
  constructor(container) {
    this.container = container;
    this.disposed = false;
    this.mouseX = 0;
    this.mouseY = 0;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    this.camera.position.z = 25;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.zIndex = '-1';
    this.renderer.domElement.style.pointerEvents = 'none';
    container.appendChild(this.renderer.domElement);

    this._createParticles();
    this._createLines();
    this._updateColors();

    // React to dark/light mode toggle
    this._themeObserver = new MutationObserver(() => this._updateColors());
    this._themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    this._onMouseMove = (e) => {
      this.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

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

  /** @private */
  _isDarkMode() {
    return document.documentElement.dataset.theme === 'dark';
  }

  /**
   * Scatter particles randomly across a 3D volume, slightly skewed toward
   * the background (negative Z) so the foreground feels less crowded.
   * Each particle stores its own XY velocity for drifting motion.
   * @private
   */
  _createParticles() {
    const positions = new Float32Array(PARTICLE_COUNT * 3);

    /** @type {Array<{x:number,y:number,z:number,vx:number,vy:number}>} */
    this.particleData = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Spread particles over a wide XY area so boundaries are never visible
      const x = (Math.random() - 0.5) * 44;
      const y = (Math.random() - 0.5) * 28;
      // Z range -15 to +5: mostly background, some foreground for depth variety
      const z = Math.random() * 20 - 15;

      positions[i * 3]     = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      this.particleData.push({
        x, y, z,
        vx: (Math.random() - 0.5) * 0.007,
        vy: (Math.random() - 0.5) * 0.005,
      });
    }

    const geo = new THREE.BufferGeometry();
    this.particlePosAttr = new THREE.BufferAttribute(positions, 3);
    this.particlePosAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.particlePosAttr);

    this.particleMat = new THREE.PointsMaterial({
      size: 0.13,
      transparent: true,
      sizeAttenuation: true, // smaller = further = natural depth
    });

    this.particles = new THREE.Points(geo, this.particleMat);
    this.scene.add(this.particles);
  }

  /**
   * Pre-allocate GPU buffers for up to MAX_LINES line segments.
   * Vertex colors are used so each segment endpoint can encode
   * different brightness based on proximity and depth.
   * @private
   */
  _createLines() {
    const positions = new Float32Array(MAX_LINES * 6);
    const colors    = new Float32Array(MAX_LINES * 6);

    const geo = new THREE.BufferGeometry();
    this.linePosAttr = new THREE.BufferAttribute(positions, 3);
    this.lineColAttr = new THREE.BufferAttribute(colors, 3);
    this.linePosAttr.setUsage(THREE.DynamicDrawUsage);
    this.lineColAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', this.linePosAttr);
    geo.setAttribute('color',    this.lineColAttr);
    geo.setDrawRange(0, 0);

    this.lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
    });

    this.lineSegments = new THREE.LineSegments(geo, this.lineMat);
    this.scene.add(this.lineSegments);
  }

  /**
   * Sync particle and line colors to the current dark/light theme.
   * Line vertex colors are rebuilt each frame in _updateLines(), so only
   * material-level properties need updating here.
   * @private
   */
  _updateColors() {
    const dark = this._isDarkMode();

    if (this.particleMat) {
      this.particleMat.color = new THREE.Color(dark ? 0xa78bfa : 0x7c3aed);
      this.particleMat.opacity = dark ? 0.95 : 0.75;
    }

    if (this.lineMat) {
      // Overall line opacity; per-vertex brightness handles depth + distance
      this.lineMat.opacity = dark ? 0.7 : 0.5;
    }
  }

  /**
   * Recompute active line segments each frame.
   * For each particle pair closer than CONNECTION_DISTANCE, write a line
   * segment into the pre-allocated buffer. Vertex color alpha encodes:
   *   - distance falloff (closer = brighter)
   *   - depth falloff (further from camera in Z = dimmer, like fog)
   *
   * Uses setDrawRange so the GPU only processes active segments.
   * @private
   */
  _updateLines() {
    const posArr = this.linePosAttr.array;
    const colArr = this.lineColAttr.array;
    const data   = this.particleData;
    let lineCount = 0;

    const dark = this._isDarkMode();
    // Base line color components (will be scaled per-vertex by alpha)
    const lr = dark ? 0xa7 / 255 : 0x7c / 255;
    const lg = dark ? 0x8b / 255 : 0x3a / 255;
    const lb = dark ? 0xfa / 255 : 0xed / 255;

    for (let i = 0; i < PARTICLE_COUNT && lineCount < MAX_LINES; i++) {
      const pi = data[i];
      for (let j = i + 1; j < PARTICLE_COUNT && lineCount < MAX_LINES; j++) {
        const pj = data[j];

        const dx   = pi.x - pj.x;
        const dy   = pi.y - pj.y;
        const dz   = pi.z - pj.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist >= CONNECTION_DISTANCE) continue;

        // Distance falloff: 1 when touching, 0 at CONNECTION_DISTANCE
        const distAlpha = 1 - dist / CONNECTION_DISTANCE;

        // Depth fog: average Z mapped from -15 (far) → 0.1, to +5 (near) → 1.0
        const avgZ       = (pi.z + pj.z) * 0.5;
        const depthAlpha = Math.max(0.08, (avgZ + 15) / 20);

        const alpha = distAlpha * depthAlpha;

        const base = lineCount * 6;
        posArr[base]     = pi.x;  posArr[base + 1] = pi.y;  posArr[base + 2] = pi.z;
        posArr[base + 3] = pj.x;  posArr[base + 4] = pj.y;  posArr[base + 5] = pj.z;

        colArr[base]     = lr * alpha;  colArr[base + 1] = lg * alpha;  colArr[base + 2] = lb * alpha;
        colArr[base + 3] = lr * alpha;  colArr[base + 4] = lg * alpha;  colArr[base + 5] = lb * alpha;

        lineCount++;
      }
    }

    this.linePosAttr.needsUpdate = true;
    this.lineColAttr.needsUpdate = true;
    this.lineSegments.geometry.setDrawRange(0, lineCount * 2);
  }

  /**
   * Main render loop: moves particles, recomputes lines, applies mouse parallax.
   * @private
   */
  _animate() {
    if (this.disposed) return;
    requestAnimationFrame(() => this._animate());

    const posArr = this.particlePosAttr.array;
    const data   = this.particleData;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = data[i];
      p.x += p.vx;
      p.y += p.vy;

      // Wrap at field boundaries — particles re-enter from the opposite edge
      if (p.x >  22) p.x = -22;
      else if (p.x < -22) p.x =  22;
      if (p.y >  14) p.y = -14;
      else if (p.y < -14) p.y =  14;

      posArr[i * 3]     = p.x;
      posArr[i * 3 + 1] = p.y;
      posArr[i * 3 + 2] = p.z;
    }
    this.particlePosAttr.needsUpdate = true;

    this._updateLines();

    // Parallax: camera drifts toward mouse with smooth easing
    this.camera.position.x += (this.mouseX * 3   - this.camera.position.x) * 0.04;
    this.camera.position.y += (-this.mouseY * 2  - this.camera.position.y) * 0.04;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Stop the animation loop and free all GPU resources.
   * Must be called when navigating away from the home page.
   */
  dispose() {
    this.disposed = true;
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('resize', this._onResize);
    this._themeObserver.disconnect();

    this.scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material)  obj.material.dispose();
    });

    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
