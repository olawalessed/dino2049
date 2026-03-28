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

  const roadSegmentLength = 60;
  const roadSegmentCount = 6;
  const roadSegments = [];

  const roadGeometry = new THREE.PlaneGeometry(10, roadSegmentLength, 1, 1);
  const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x2f2f2f });

  const grassGeometry = new THREE.PlaneGeometry(20, roadSegmentLength, 1, 1);
  const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x2f855a });

  for (let i = 0; i < roadSegmentCount; i += 1) {
    const segmentGroup = new THREE.Group();
    segmentGroup.position.z = -(i * roadSegmentLength);

    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = -0.001;
    segmentGroup.add(grass);

    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    segmentGroup.add(road);

    scene.add(segmentGroup);
    roadSegments.push(segmentGroup);
  }

  const laneLineMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const laneLineGeometry = new THREE.BoxGeometry(0.25, 0.04, 6);
  const laneLines = [];
  const laneSpacing = 12;
  const laneLineCount = 30;

  for (let i = 0; i < laneLineCount; i += 1) {
    const laneLine = new THREE.Mesh(laneLineGeometry, laneLineMaterial);
    laneLine.position.set(0, 0.03, -i * laneSpacing);
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
    roadSegments,
    roadSegmentLength,
    laneLines,
    laneSpacing,
    dispose: () => window.removeEventListener('resize', handleResize),
  };
}
