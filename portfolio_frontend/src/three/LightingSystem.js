/**
 * LightingSystem.js — Gallery lighting with per-panel spotlights and theme support.
 *
 * Creates the lighting environment for the 3D gallery room:
 *   1. Purple-tinted ambient light — subtle fill that gives the room its color mood
 *   2. Overhead point light — soft lavender light centered on the ceiling
 *   3. Per-panel spotlights — warm white spots aimed at each project panel,
 *      simulating museum/gallery lighting that highlights artwork
 *
 * The lighting intensity adjusts based on the site's light/dark theme:
 *   - Dark mode: lower ambient (0.3) with deeper purple — moodier atmosphere
 *   - Light mode: higher ambient (0.6) with lighter purple — brighter gallery
 *
 * Spotlights use a warm white color (0xfff5eb) to contrast with the cool purple
 * ambient, drawing the eye to the project panels.
 *
 * @module LightingSystem
 */

import * as THREE from 'three';

export class LightingSystem {
  /**
   * Create the base lighting and add it to the scene.
   *
   * @param {THREE.Scene} scene - The scene to add lights to
   */
  constructor(scene) {
    this.scene = scene;

    /** @type {THREE.Light[]} All lights managed by this system, for cleanup */
    this.lights = [];

    // Ambient light — purple-tinted fill for the whole room
    this.ambient = new THREE.AmbientLight(0x2d1a4e, 0.4);
    scene.add(this.ambient);
    this.lights.push(this.ambient);

    // Overhead point light — soft lavender from the center of the ceiling
    const overhead = new THREE.PointLight(0xf0e6ff, 0.6, 30);
    overhead.position.set(0, 4.5, 0);
    scene.add(overhead);
    this.lights.push(overhead);
  }

  /**
   * Add a spotlight aimed at a project panel's position.
   *
   * Each spotlight is placed near the ceiling (Y=4.2) directly above the
   * panel and aimed downward at the panel's center. Uses warm white color
   * with a 30-degree cone angle and soft penumbra.
   *
   * @param {THREE.Vector3} position - The panel's world position to illuminate
   * @returns {THREE.SpotLight} The created spotlight
   */
  addPanelSpotlight(position) {
    const spot = new THREE.SpotLight(0xfff5eb, 1.5, 8, Math.PI / 6, 0.5, 1);
    spot.position.set(position.x, 4.2, position.z);
    spot.target.position.copy(position);
    this.scene.add(spot);
    this.scene.add(spot.target);
    this.lights.push(spot);
    return spot;
  }

  /**
   * Adjust ambient lighting to match the site's light/dark theme.
   * Dark mode uses lower intensity and deeper purple for a moodier feel.
   * Light mode uses higher intensity and lighter purple for brightness.
   *
   * @param {'light'|'dark'} theme - The current theme
   */
  setTheme(theme) {
    if (theme === 'dark') {
      this.ambient.intensity = 0.3;
      this.ambient.color.set(0x2d1a4e);
    } else {
      this.ambient.intensity = 0.6;
      this.ambient.color.set(0x5b3d8f);
    }
  }

  /**
   * Remove all lights from the scene.
   * SpotLight targets are also removed since they are separate scene objects.
   */
  dispose() {
    for (const light of this.lights) {
      this.scene.remove(light);
      if (light.target) this.scene.remove(light.target);
    }
  }
}
