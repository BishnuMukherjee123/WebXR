import * as THREE from "three";

export function createScene() {
  const scene = new THREE.Scene();

  // Hemisphere light — soft ambient sky/ground light
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8888aa, 2);
  scene.add(hemiLight);

  // Directional light — needed for PBR materials to show depth/shading
  // Without this, GLB models with metallic/roughness maps look flat or black
  const dirLight = new THREE.DirectionalLight(0xffffff, 3);
  dirLight.position.set(1, 3, 2);
  scene.add(dirLight);

  return scene;
}