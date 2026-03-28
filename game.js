import { createPlayer } from './player.js';

export function createGame({ scene, camera, renderer, ground, laneLines }) {
  const player = createPlayer();
  scene.add(player.mesh);

  const state = {
    running: false,
    speed: 20,
    elapsedTime: 0,
    previousTime: 0,
  };

  const resetTrackSegment = (segment) => {
    if (segment.position.z > 10) {
      segment.position.z -= 160;
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

    // Move visual track elements toward camera to simulate forward motion.
    ground.position.z += state.speed * delta;
    if (ground.position.z > 20) {
      ground.position.z = -80;
    }

    laneLines.forEach((line) => {
      line.position.z += state.speed * delta;
      resetTrackSegment(line);
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
