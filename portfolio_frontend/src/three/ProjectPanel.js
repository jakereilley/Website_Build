/**
 * ProjectPanel.js — 3D panel that displays a project in the gallery.
 *
 * Each ProjectPanel represents one project hung on the gallery wall, consisting of:
 *   1. A picture frame (BoxGeometry with metallic purple material)
 *   2. A canvas-textured surface showing the project title, description, and tech tags
 *   3. A glow ring behind the frame that appears on hover
 *
 * The panel surface is rendered using the Canvas 2D API onto an offscreen canvas,
 * then converted to a Three.js CanvasTexture. This approach avoids HTML-in-3D
 * complexity while providing crisp text rendering. The canvas renders:
 *   - A purple accent stripe at the top
 *   - Project title in bold white
 *   - Description text (word-wrapped, up to 5 lines)
 *   - Technology tags as rounded pill badges
 *   - A "Click to view details" hint at the bottom
 *
 * Hover behavior (driven by InteractionManager):
 *   - Purple glow ring fades in behind the frame (opacity 0 → 0.6)
 *   - Panel scales up slightly (1.0 → 1.03)
 *   - Both animate smoothly via lerp in update()
 *
 * Both the panel surface and frame meshes carry userData references so the
 * InteractionManager's raycaster can identify them as clickable project panels.
 *
 * @module ProjectPanel
 */

import * as THREE from 'three';

/** @type {number} Panel surface width in world units */
const PANEL_WIDTH = 3;

/** @type {number} Panel surface height in world units */
const PANEL_HEIGHT = 2;

/** @type {number} Frame thickness (Z depth) in world units */
const FRAME_DEPTH = 0.08;

export class ProjectPanel {
  /**
   * Create a new project panel.
   *
   * @param {Object} project - The project data to display
   * @param {string} project.title - Project title
   * @param {string} project.description - Project description
   * @param {string[]} [project.technologies] - Technology names for tag badges
   */
  constructor(project) {
    this.project = project;

    /** @type {THREE.Group} Container group — position/rotate this to place the panel */
    this.group = new THREE.Group();

    /** @type {boolean} Current hover state (set by InteractionManager) */
    this.isHovered = false;

    /** @type {number} Current scale factor, animated toward 1.0 or 1.03 */
    this._baseScale = 1;

    this._build();
  }

  /**
   * Build the panel's 3D geometry: frame, textured surface, and glow ring.
   * Sets userData on meshes for raycaster identification.
   * @private
   */
  _build() {
    // Frame — slightly larger than the panel surface, metallic purple
    const frameGeo = new THREE.BoxGeometry(
      PANEL_WIDTH + 0.2,
      PANEL_HEIGHT + 0.2,
      FRAME_DEPTH
    );
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x3d2a6e,
      metalness: 0.6,
      roughness: 0.3,
    });
    this.frame = new THREE.Mesh(frameGeo, frameMat);
    this.group.add(this.frame);

    // Panel surface — PlaneGeometry with a CanvasTexture showing project info
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 340;
    this._renderToCanvas(canvas);

    this.texture = new THREE.CanvasTexture(canvas);
    this.texture.minFilter = THREE.LinearFilter;

    const panelGeo = new THREE.PlaneGeometry(PANEL_WIDTH, PANEL_HEIGHT);
    const panelMat = new THREE.MeshStandardMaterial({
      map: this.texture,
      roughness: 0.4,
      metalness: 0.0,
    });
    this.panel = new THREE.Mesh(panelGeo, panelMat);
    this.panel.position.z = FRAME_DEPTH / 2 + 0.01; // Slightly in front of frame
    this.group.add(this.panel);

    // Glow ring — purple ring behind the frame, invisible until hovered
    const glowGeo = new THREE.RingGeometry(
      Math.max(PANEL_WIDTH, PANEL_HEIGHT) * 0.55,
      Math.max(PANEL_WIDTH, PANEL_HEIGHT) * 0.6,
      32
    );
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x7c3aed,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    this.glow = new THREE.Mesh(glowGeo, glowMat);
    this.glow.position.z = -FRAME_DEPTH / 2 - 0.01; // Behind the frame
    this.group.add(this.glow);

    // Tag both meshes with userData so the raycaster can identify them
    this.panel.userData = { type: 'project-panel', project: this.project, controller: this };
    this.frame.userData = { type: 'project-panel', project: this.project, controller: this };
  }

  /**
   * Render project information onto a 2D canvas using the Canvas API.
   * This canvas is used as the texture for the panel surface.
   *
   * Layout (top to bottom):
   *   - 4px purple accent stripe
   *   - Title (bold 28px, white)
   *   - Description (16px, muted purple, word-wrapped, max 5 lines)
   *   - Technology tags (13px pills with purple background)
   *   - "Click to view details" hint (italic, bottom)
   *
   * @param {HTMLCanvasElement} canvas - The offscreen canvas to draw on (512x340)
   * @private
   */
  _renderToCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Dark purple gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#1a1230');
    gradient.addColorStop(1, '#0f0a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Purple accent line at top
    ctx.fillStyle = '#7c3aed';
    ctx.fillRect(0, 0, w, 4);

    // Title
    ctx.fillStyle = '#f0ecf9';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(this.project.title || 'Untitled', 24, 50);

    // Description — word-wrapped, limited to 5 lines
    ctx.fillStyle = '#9b8fb8';
    ctx.font = '16px sans-serif';
    const desc = this.project.description || '';
    const lines = wrapText(ctx, desc, w - 48, 16);
    lines.slice(0, 5).forEach((line, i) => {
      ctx.fillText(line, 24, 85 + i * 22);
    });

    // Technology tags — rounded pill badges, max 5 tags
    const techs = this.project.technologies || [];
    const techY = 210;
    ctx.font = '13px sans-serif';
    let techX = 24;
    for (const tech of techs.slice(0, 5)) {
      const tw = ctx.measureText(tech).width + 16;
      // Tag background (semi-transparent purple)
      ctx.fillStyle = 'rgba(124, 58, 237, 0.3)';
      roundRect(ctx, techX, techY, tw, 24, 4);
      ctx.fill();
      // Tag text
      ctx.fillStyle = '#a78bfa';
      ctx.fillText(tech, techX + 8, techY + 16);
      techX += tw + 8;
      if (techX > w - 48) break;
    }

    // "Click to view" hint at the bottom
    ctx.fillStyle = '#5b21b6';
    ctx.font = 'italic 13px sans-serif';
    ctx.fillText('Click to view details', 24, h - 20);
  }

  /**
   * Set the hover state. Called by InteractionManager when the raycaster
   * detects the mouse entering or leaving this panel.
   *
   * @param {boolean} hovered - Whether the panel is currently hovered
   */
  setHovered(hovered) {
    if (hovered === this.isHovered) return;
    this.isHovered = hovered;
  }

  /**
   * Animate the hover effect each frame. Smoothly interpolates (lerps)
   * the glow ring opacity and panel scale toward their target values.
   * Called from the SceneManager's render loop via onUpdate().
   *
   * @param {number} delta - Seconds since last frame
   */
  update(delta) {
    const targetOpacity = this.isHovered ? 0.6 : 0;
    const targetScale = this.isHovered ? 1.03 : 1;

    this.glow.material.opacity += (targetOpacity - this.glow.material.opacity) * delta * 8;
    this._baseScale += (targetScale - this._baseScale) * delta * 8;
    this.group.scale.setScalar(this._baseScale);
  }

  /**
   * Get the panel's container group for adding to the scene.
   * @returns {THREE.Group}
   */
  getGroup() {
    return this.group;
  }

  /**
   * Get the raycastable meshes (panel surface and frame).
   * Pass these to InteractionManager.addInteractable().
   * @returns {THREE.Mesh[]}
   */
  getMeshes() {
    return [this.panel, this.frame];
  }
}

/**
 * Word-wrap text to fit within a maximum pixel width.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas context (for measureText)
 * @param {string} text - The text to wrap
 * @param {number} maxWidth - Maximum line width in pixels
 * @returns {string[]} Array of wrapped lines
 */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const test = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Draw a rounded rectangle path on the canvas context.
 * Must call ctx.fill() or ctx.stroke() afterward to render it.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - Top-left X coordinate
 * @param {number} y - Top-left Y coordinate
 * @param {number} w - Rectangle width
 * @param {number} h - Rectangle height
 * @param {number} r - Corner radius
 */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
