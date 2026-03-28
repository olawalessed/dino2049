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

    camera.position.x = 0;
    camera.position.y = 5;
    camera.position.z = 10;
    camera.lookAt(player.mesh.position.x, player.mesh.position.y + 1, player.mesh.position.z - 8);

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
    },
  };
}
