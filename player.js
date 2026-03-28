import * as THREE from 'https://unpkg.com/three@0.164.1/build/three.module.js';

export function createPlayer() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x2563eb });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(0, 0.5, 2);
  mesh.castShadow = true;

  return {
    mesh,
    update: () => {
      // Placeholder for future player movement/jump logic.
    },
  };
}
