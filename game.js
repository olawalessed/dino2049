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
  ui,
}) {
  const player = createPlayer();
  scene.add(player.mesh);

  const obstacleMaterials = {
    ground: new THREE.MeshStandardMaterial({ color: 0x16a34a }),
    air: new THREE.MeshStandardMaterial({ color: 0x7c3aed }),
    low: new THREE.MeshStandardMaterial({ color: 0xf59e0b }),
    hit: new THREE.MeshStandardMaterial({ color: 0xef4444 }),
  };

  const obstacleConfigs = {
    ground: {
      size: new THREE.Vector3(1.1, 1.1, 1.1),
      y: 0.55,
      damageMessage: 'Hit a ground obstacle.',
    },
    air: {
      size: new THREE.Vector3(1, 1, 1),
      y: 2.25,
      damageMessage: 'Hit an air obstacle while jumping too high.',
    },
    low: {
      size: new THREE.Vector3(1.25, 0.5, 1),
      y: 1.02,
      damageMessage: 'Failed to duck under a low obstacle.',
    },
  };

  const state = {
    running: false,
    started: false,
    speed: 20,
    elapsedTime: 0,
    previousTime: 0,
    score: 0,
    damageTaken: 0,
  };

  const spawnSettings = {
    minInterval: 1,
    maxInterval: 1.55,
    minSpawnZ: -90,
    maxSpawnZ: -72,
    despawnZ: 16,
    nextSpawnIn: 0,
    typeRolls: ['ground', 'ground', 'air', 'low'],
  };

  const obstacleState = {
    active: [],
    playerBounds: new THREE.Box3(),
    obstacleBounds: new THREE.Box3(),
    lastSpawnType: 'ground',
  };

  const cameraRig = {
    baseOffset: new THREE.Vector3(0, 5, 10),
    targetPosition: new THREE.Vector3(),
    smoothSpeed: 8,
    jumpFollowScale: 0.5,
    speedTiltScale: 0.01,
    maxForwardTilt: 0.08,
  };

  const randomBetween = (min, max) => min + Math.random() * (max - min);

  const scheduleNextSpawn = () => {
    const interval = randomBetween(spawnSettings.minInterval, spawnSettings.maxInterval);
    spawnSettings.nextSpawnIn = interval;
  };

  const pickObstacleType = () => {
    const pool = spawnSettings.typeRolls;
    const randomType = pool[Math.floor(Math.random() * pool.length)];

    // Prevent repetitive low obstacles so duck timing stays fair.
    if (randomType === 'low' && obstacleState.lastSpawnType === 'low') {
      return Math.random() > 0.5 ? 'ground' : 'air';
    }

    return randomType;
  };

  const spawnObstacle = () => {
    const type = pickObstacleType();
    const config = obstacleConfigs[type];
    const geometry = new THREE.BoxGeometry(config.size.x, config.size.y, config.size.z);
    const mesh = new THREE.Mesh(geometry, obstacleMaterials[type].clone());
    mesh.position.set(0, config.y, randomBetween(spawnSettings.minSpawnZ, spawnSettings.maxSpawnZ));
    mesh.castShadow = true;
    scene.add(mesh);

    obstacleState.lastSpawnType = type;
    obstacleState.active.push({
      mesh,
      size: config.size,
      type,
      hit: false,
      scored: false,
      damageMessage: config.damageMessage,
    });
  };

  const recycleForwardMovingSegment = (segment, totalLength) => {
    if (segment.position.z > roadSegmentLength) {
      segment.position.z -= totalLength;
    }
  };

  const clearObstacle = (obstacle) => {
    scene.remove(obstacle.mesh);
    obstacle.mesh.geometry.dispose();
    obstacle.mesh.material.dispose();
  };

  const applyDamage = (obstacle) => {
    obstacle.hit = true;
    obstacle.mesh.material.dispose();
    obstacle.mesh.material = obstacleMaterials.hit.clone();
    state.damageTaken += 1;
    // eslint-disable-next-line no-console
    console.log(`[Runner] Damage ${state.damageTaken}: ${obstacle.damageMessage}`);
  };

  const checkObstacleCollision = (obstacle) => {
    if (obstacle.hit) {
      return;
    }

    const playerBounds = obstacleState.playerBounds.copy(player.getBounds());
    obstacleState.obstacleBounds.setFromCenterAndSize(obstacle.mesh.position, obstacle.size);

    if (!playerBounds.intersectsBox(obstacleState.obstacleBounds)) {
      return;
    }

    if (obstacle.type === 'ground' && player.isJumping()) {
      return;
    }

    if (obstacle.type === 'low' && player.isDucking()) {
      return;
    }

    applyDamage(obstacle);
  };

  const updateObstacles = (delta) => {
    spawnSettings.nextSpawnIn -= delta;
    if (spawnSettings.nextSpawnIn <= 0) {
      spawnObstacle();
      scheduleNextSpawn();
    }

    const travelDistance = state.speed * delta;

    for (let i = obstacleState.active.length - 1; i >= 0; i -= 1) {
      const obstacle = obstacleState.active[i];
      obstacle.mesh.position.z += travelDistance;

      checkObstacleCollision(obstacle);

      if (!obstacle.scored && obstacle.mesh.position.z > player.mesh.position.z + 0.4) {
        obstacle.scored = true;
        state.score += 25;
      }

      if (obstacle.mesh.position.z > spawnSettings.despawnZ) {
        clearObstacle(obstacle);
        obstacleState.active.splice(i, 1);
      }
    }
  };

  const renderHud = () => {
    if (!ui) {
      return;
    }

    if (ui.score) {
      ui.score.textContent = `${Math.floor(state.score)}`;
    }

    if (ui.prompt) {
      ui.prompt.style.opacity = state.started ? '0' : '1';
      ui.prompt.style.pointerEvents = state.started ? 'none' : 'auto';
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

    roadSegments.forEach((segment) => {
      segment.position.z += travelDistance;
      recycleForwardMovingSegment(segment, totalRoadLength);
    });

    laneLines.forEach((line) => {
      line.position.z += travelDistance;
      if (line.position.z > laneSpacing) {
        line.position.z -= totalLaneLength;
      }
    });

    player.update(delta, state);
    updateObstacles(delta);

    state.score += delta * 10;
    renderHud();

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

  const handleStartKey = (event) => {
    if (event.code !== 'Space' || state.started) {
      return;
    }

    event.preventDefault();
    state.started = true;
    state.running = true;
    state.previousTime = performance.now() * 0.001;
    state.elapsedTime = 0;
    scheduleNextSpawn();
    renderHud();
    requestAnimationFrame(animate);
  };

  window.addEventListener('keydown', handleStartKey);
  renderHud();

  return {
    start: () => {
      renderHud();
    },
    stop: () => {
      state.running = false;
      obstacleState.active.forEach((obstacle) => clearObstacle(obstacle));
      obstacleState.active.length = 0;
      player.dispose();
      window.removeEventListener('keydown', handleStartKey);
    },
  };
}
