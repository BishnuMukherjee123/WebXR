import * as THREE from "three";

export function createRenderer(container) {
  console.log("🎬 Creating WebGL renderer...");

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,            // transparent canvas → AR camera shows through
    powerPreference: "high-performance",
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // ✅ CRITICAL: transparent background so the camera passthrough is visible
  renderer.setClearColor(0x000000, 0);

  // ✅ CRITICAL for GLTF/GLB with PBR materials:
  // Without sRGB color space, textures render washed out or pitch-black.
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // ✅ Tone mapping makes PBR materials look physically correct in AR
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;

  // Enable WebXR
  renderer.xr.enabled = true;
  console.log("✅ Renderer ready (XR + sRGB + tone mapping)");

  container.appendChild(renderer.domElement);

  return renderer;
}