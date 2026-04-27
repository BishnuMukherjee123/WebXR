import * as THREE from "three";

export function createRenderer(container) {
  console.log("🎬 Creating WebGL renderer...");
  
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    xrCompatible: true, // 🔥 CRITICAL for XR
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // 🔥 THIS enables WebXR
  renderer.xr.enabled = true;
  console.log("✅ XR enabled on renderer");

  container.appendChild(renderer.domElement);

  return renderer;
}