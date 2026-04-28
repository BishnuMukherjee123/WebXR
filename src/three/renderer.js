import * as THREE from "three";

export function createRenderer(container) {
  console.log("🎬 Creating WebGL renderer...");

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,       // needed for transparent canvas (AR passthrough)
    powerPreference: "high-performance",
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // 🔥 CRITICAL: transparent clear color so camera feed shows through
  // Without this, the WebGL canvas renders solid BLACK over the camera.
  renderer.setClearColor(0x000000, 0);

  // 🔥 THIS enables WebXR
  renderer.xr.enabled = true;
  console.log("✅ XR enabled on renderer");

  container.appendChild(renderer.domElement);

  return renderer;
}