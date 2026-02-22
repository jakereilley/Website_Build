/**
 * GalleryRoom.js — 3D gallery room geometry for the project showcase.
 *
 * Builds a rectangular room (30 x 20 x 5 units) consisting of:
 *   - Floor, ceiling, and four walls using MeshStandardMaterial
 *   - Decorative purple-glowing trim lines along the base of every wall
 *
 * The room uses dark purple-tinted materials that pair with the
 * LightingSystem's purple ambient light for a cohesive gallery aesthetic.
 *
 * Room dimensions:
 *   - Width (X): 30 units — left wall at -15, right wall at +15
 *   - Depth (Z): 20 units — back wall at -10, front wall at +10
 *   - Height (Y): 5 units — floor at 0, ceiling at 5
 *
 * The getPanelPositions() method calculates where project panels should
 * be hung along the walls in a U-shaped layout (left → back → right),
 * evenly distributing panels across the three walls.
 *
 * @module GalleryRoom
 */

import * as THREE from 'three';

export class GalleryRoom {
  /**
   * Create the gallery room. Immediately builds all geometry.
   */
  constructor() {
    /** @type {THREE.Group} Container for all room meshes */
    this.group = new THREE.Group();
    this._build();
  }

  /**
   * Build the room geometry: floor, ceiling, four walls, and decorative trim.
   * All meshes are added to this.group.
   * @private
   */
  _build() {
    const roomWidth = 30;
    const roomDepth = 20;
    const roomHeight = 5;

    // Floor — dark purple, flat on the XZ plane
    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1a1230,
      roughness: 0.8,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.group.add(floor);

    // Ceiling — darker purple, at Y = roomHeight
    const ceilingGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: 0x110d1f,
      roughness: 0.9,
    });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomHeight;
    this.group.add(ceiling);

    // Wall material — shared base color, cloned per wall for independent state
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x150f28,
      roughness: 0.7,
      metalness: 0.05,
    });

    // Back wall (at -Z)
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomWidth, roomHeight),
      wallMat
    );
    backWall.position.set(0, roomHeight / 2, -roomDepth / 2);
    this.group.add(backWall);

    // Front wall (at +Z, rotated to face inward)
    const frontWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomWidth, roomHeight),
      wallMat.clone()
    );
    frontWall.position.set(0, roomHeight / 2, roomDepth / 2);
    frontWall.rotation.y = Math.PI;
    this.group.add(frontWall);

    // Left wall (at -X, rotated to face inward)
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomDepth, roomHeight),
      wallMat.clone()
    );
    leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    this.group.add(leftWall);

    // Right wall (at +X, rotated to face inward)
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomDepth, roomHeight),
      wallMat.clone()
    );
    rightWall.position.set(roomWidth / 2, roomHeight / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    this.group.add(rightWall);

    // Decorative floor trim — purple emissive lines at the base of each wall
    const trimGeo = new THREE.BoxGeometry(roomWidth + 0.1, 0.05, 0.05);
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.5,
    });

    // Front and back trim (along X axis)
    const trimBack = new THREE.Mesh(trimGeo, trimMat);
    trimBack.position.set(0, 0.025, -roomDepth / 2 + 0.025);
    this.group.add(trimBack);

    const trimFront = new THREE.Mesh(trimGeo, trimMat);
    trimFront.position.set(0, 0.025, roomDepth / 2 - 0.025);
    this.group.add(trimFront);

    // Left and right trim (along Z axis)
    const trimSideGeo = new THREE.BoxGeometry(0.05, 0.05, roomDepth + 0.1);
    const trimLeft = new THREE.Mesh(trimSideGeo, trimMat);
    trimLeft.position.set(-roomWidth / 2 + 0.025, 0.025, 0);
    this.group.add(trimLeft);

    const trimRight = new THREE.Mesh(trimSideGeo, trimMat);
    trimRight.position.set(roomWidth / 2 - 0.025, 0.025, 0);
    this.group.add(trimRight);
  }

  /**
   * Get the Three.js Group containing all room meshes.
   * Add this to the scene via SceneManager.addToScene().
   *
   * @returns {THREE.Group} The room mesh group
   */
  getGroup() {
    return this.group;
  }

  /**
   * Calculate panel hanging positions along the walls in a U-shaped layout.
   *
   * Distributes the requested number of panels across three walls:
   *   1. Left wall — panels face right (+X), rotated 90°
   *   2. Back wall — panels face forward (+Z), no rotation
   *   3. Right wall — panels face left (-X), rotated -90°
   *
   * Panels are evenly spaced within each wall segment and positioned at
   * Y=2.2 (eye level), offset slightly from the wall surface.
   *
   * @param {number} count - Total number of panels to position
   * @returns {Array<{position: THREE.Vector3, rotation: THREE.Euler}>}
   *   Array of position/rotation pairs for placing ProjectPanel groups
   */
  getPanelPositions(count) {
    const positions = [];
    const wallOffset = 0.1;

    const slots = [];

    // Left wall panels (facing right, +X direction)
    const leftCount = Math.ceil(count / 3);
    for (let i = 0; i < leftCount; i++) {
      const z = -7 + (14 / (leftCount + 1)) * (i + 1);
      slots.push({
        position: new THREE.Vector3(-15 + wallOffset + 0.5, 2.2, z),
        rotation: new THREE.Euler(0, Math.PI / 2, 0),
      });
    }

    // Back wall panels (facing forward, +Z direction)
    const backCount = Math.ceil(count / 3);
    for (let i = 0; i < backCount; i++) {
      const x = -10 + (20 / (backCount + 1)) * (i + 1);
      slots.push({
        position: new THREE.Vector3(x, 2.2, -10 + wallOffset + 0.5),
        rotation: new THREE.Euler(0, 0, 0),
      });
    }

    // Right wall panels (facing left, -X direction)
    const rightCount = count - leftCount - backCount;
    for (let i = 0; i < rightCount; i++) {
      const z = -7 + (14 / (rightCount + 1)) * (i + 1);
      slots.push({
        position: new THREE.Vector3(15 - wallOffset - 0.5, 2.2, z),
        rotation: new THREE.Euler(0, -Math.PI / 2, 0),
      });
    }

    return slots.slice(0, count);
  }
}
