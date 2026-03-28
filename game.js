import * as THREE from 'https://unpkg.com/three@0.164.1/build/three.module.js';
import { createPlayer } from './player.js';

export function createGame({
  scene,
  camera,
  renderer,
  roadSegments,
  roadSegmentLength,
  laneLines,
  laneSpacing,
}) {
  const player = createPlayer();
  scene.add(player.mesh);

  const state = {
    running: false,
    speed: 20,
    elapsedTime: 0,
    previousTime: 0,
  };

  const cameraRig = {
    baseOffset: new THREE.Vector3(0, 5, 10),
    targetPosition: new THREE.Vector3(),
    smoothSpeed: 8,
    jumpFollowScale: 0.5,
    speedTiltScale: 0.01,
    maxForwardTilt: 0.08,
  };

  const recycleForwardMovingSegment = (segment, totalLength) => {
    if (segment.position.z > roadSegmentLength) {
      segment.position.z -= totalLength;
    }
  };

  const animate = (time) => {
    if (!state.running) {
      return;
    }

    const seconds = time * 0.001;
    const delta = Math.min(seconds - state.previousTime, 0.033);
    state.previousTime = seconds;
    state.elapsedTime += delta;

    const travelDistance = state.speed * delta;
    const totalRoadLength = roadSegments.length * roadSegmentLength;
    const totalLaneLength = laneLines.length * laneSpacing;

    // Move repeated road segments toward the camera for an infinite-runner effect.
    roadSegments.forEach((segment) => {
      segment.position.z += travelDistance;
      recycleForwardMovingSegment(segment, totalRoadLength);
    });

    // Move dashed lane markers backward continuously with seamless looping.
    laneLines.forEach((line) => {
      line.position.z += travelDistance;
      if (line.position.z > laneSpacing) {
        line.position.z -= totalLaneLength;
      }
    });

    player.update(delta, state);

    const jumpOffset = player.getJumpOffset();
    cameraRig.targetPosition.set(
      player.mesh.position.x + cameraRig.baseOffset.x,
      cameraRig.baseOffset.y + jumpOffset * cameraRig.jumpFollowScale,
      cameraRig.baseOffset.z,
    );

    const lerpAlpha = Math.min(delta * cameraRig.smoothSpeed, 1);
    camera.position.lerp(cameraRig.targetPosition, lerpAlpha);

    const forwardTilt = Math.min(state.speed * cameraRig.speedTiltScale, cameraRig.maxForwardTilt);
    const lookTarget = new THREE.Vector3(
      player.mesh.position.x,
      player.mesh.position.y + 1 + jumpOffset * 0.15,
      player.mesh.position.z - 8,
    );
    camera.lookAt(lookTarget);
    camera.rotation.x += forwardTilt;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  return {
    start: () => {
      if (state.running) {
        return;
      }

      state.running = true;
      state.previousTime = performance.now() * 0.001;
      requestAnimationFrame(animate);
    },
    stop: () => {
      state.running = false;
      player.dispose();
    },
  };
}
