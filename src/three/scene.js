import * as THREE from "three";

export function createScene() {
  const scene = new THREE.Scene();

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  return scene;
}