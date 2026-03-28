import * as THREE from 'https://unpkg.com/three@0.164.1/build/three.module.js';

export function createScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);

  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    1000,
  );
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 1, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7);
  scene.add(directionalLight);

  const groundGeometry = new THREE.PlaneGeometry(20, 200, 1, 1);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x2f855a });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -80);
  scene.add(ground);

  const laneLineMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const laneLineGeometry = new THREE.BoxGeometry(0.2, 0.02, 4);
  const laneLines = [];

  for (let i = 0; i < 20; i += 1) {
    const laneLine = new THREE.Mesh(laneLineGeometry, laneLineMaterial);
    laneLine.position.set(0, 0.01, -i * 8);
    scene.add(laneLine);
    laneLines.push(laneLine);
  }

  const handleResize = () => {
    const { clientWidth, clientHeight } = container;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight);
  };

  window.addEventListener('resize', handleResize);

  return {
    scene,
    camera,
    renderer,
    ground,
    laneLines,
    dispose: () => window.removeEventListener('resize', handleResize),
  };
}
