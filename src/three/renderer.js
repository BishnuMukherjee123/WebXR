import * as THREE from "three";

export function createRenderer(container) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });

  renderer.setSize(window.innerWidth, window.innerHeight);

  // 🔥 THIS enables WebXR
  renderer.xr.enabled = true;

  container.appendChild(renderer.domElement);

  return renderer;
}