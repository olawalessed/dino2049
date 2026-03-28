import * as THREE from 'https://unpkg.com/three@0.164.1/build/three.module.js';

export function createPlayer() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x2563eb });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(0, 0.5, 2);
  mesh.castShadow = true;

  const controls = {
    jumpQueued: false,
  };

  const stats = {
    jumpPower: 9.5,
    gravity: 28,
  };

  const physics = {
    velocityY: 0,
    groundY: 0.5,
    isGrounded: true,
  };

  const animation = {
    squashStretchStrength: 0,
    maxStrength: 0.25,
    blendSpeed: 12,
  };

  const handleKeyDown = (event) => {
    if (event.code === 'Space') {
      event.preventDefault();
      controls.jumpQueued = true;
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  return {
    mesh,
    getJumpOffset: () => Math.max(mesh.position.y - physics.groundY, 0),
    update: (delta) => {
      if (controls.jumpQueued && physics.isGrounded) {
        physics.velocityY = stats.jumpPower;
        physics.isGrounded = false;
      }
      controls.jumpQueued = false;

      physics.velocityY -= stats.gravity * delta;
      mesh.position.y += physics.velocityY * delta;

      if (mesh.position.y <= physics.groundY) {
        mesh.position.y = physics.groundY;
        physics.velocityY = 0;
        physics.isGrounded = true;
      }

      const airborneRatio = THREE.MathUtils.clamp(
        Math.abs(physics.velocityY) / stats.jumpPower,
        0,
        1,
      );
      const targetStrength = physics.isGrounded ? 0 : airborneRatio * animation.maxStrength;
      animation.squashStretchStrength = THREE.MathUtils.lerp(
        animation.squashStretchStrength,
        targetStrength,
        Math.min(delta * animation.blendSpeed, 1),
      );

      const verticalScale = 1 + animation.squashStretchStrength;
      const horizontalScale = 1 - animation.squashStretchStrength * 0.6;
      mesh.scale.set(horizontalScale, verticalScale, horizontalScale);
    },
    dispose: () => {
      window.removeEventListener('keydown', handleKeyDown);
    },
  };
}
