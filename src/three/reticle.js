import * as THREE from "three";

export function createReticle() {
  const geometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,       // white ring — visible against any surface
    side: THREE.DoubleSide, // render both faces so it's never culled
  });

  const reticle = new THREE.Mesh(geometry, material);
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;

  return reticle;
}