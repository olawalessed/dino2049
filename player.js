import * as THREE from 'https://unpkg.com/three@0.164.1/build/three.module.js';

export function createPlayer() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x2563eb });
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.set(0, 0.5, 2);
  mesh.castShadow = true;

  const controls = {
    jumpQueued: false,
    duckHeld: false,
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

  const stance = {
    standingHeight: 1,
    duckingHeight: 0.55,
    width: 0.82,
    depth: 0.82,
    targetHeight: 1,
    currentHeight: 1,
    transitionSpeed: 18,
    isDucking: false,
  };

  const animation = {
    squashStretchStrength: 0,
    maxStrength: 0.25,
    blendSpeed: 12,
  };

  const bounds = new THREE.Box3();

  const canDuck = () => physics.isGrounded && physics.velocityY === 0;

  const handleKeyDown = (event) => {
    if (event.code === 'Space') {
      event.preventDefault();
      controls.jumpQueued = true;
    }

    if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      controls.duckHeld = true;
    }
  };

  const handleKeyUp = (event) => {
    if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      controls.duckHeld = false;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  const getHalfHeight = () => stance.currentHeight * 0.5;

  const getBounds = () => {
    const halfHeight = getHalfHeight();
    bounds.min.set(
      mesh.position.x - stance.width * 0.5,
      mesh.position.y - halfHeight,
      mesh.position.z - stance.depth * 0.5,
    );
    bounds.max.set(
      mesh.position.x + stance.width * 0.5,
      mesh.position.y + halfHeight,
      mesh.position.z + stance.depth * 0.5,
    );
    return bounds;
  };

  return {
    mesh,
    isJumping: () => !physics.isGrounded,
    isDucking: () => stance.isDucking,
    getBounds,
    getJumpOffset: () => Math.max(mesh.position.y - physics.groundY, 0),
    update: (delta) => {
      if (controls.jumpQueued && physics.isGrounded && !stance.isDucking) {
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

      const wantsToDuck = controls.duckHeld && canDuck();
      stance.isDucking = wantsToDuck;
      stance.targetHeight = wantsToDuck ? stance.duckingHeight : stance.standingHeight;
      stance.currentHeight = THREE.MathUtils.lerp(
        stance.currentHeight,
        stance.targetHeight,
        Math.min(delta * stance.transitionSpeed, 1),
      );

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

      const verticalScale =
        stance.currentHeight * (1 + animation.squashStretchStrength * (stance.isDucking ? 0.25 : 1));
      const horizontalScale =
        stance.width * (1 - animation.squashStretchStrength * (stance.isDucking ? 0.3 : 0.6));
      mesh.scale.set(horizontalScale, verticalScale, stance.depth);
    },
    dispose: () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    },
  };
}
