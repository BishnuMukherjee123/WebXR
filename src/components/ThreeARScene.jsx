import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { PlacementBox } from "./PlacementBox";

const MODEL_URL = "/models/10.glb";
const MODEL_SCALE = 0.8;
const NORMALIZED_MODEL_SIZE = 1.25;

let modelAssetPromise;

export default function ThreeARScene() {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const cleanupRef = useRef(null);
  const [status, setStatus] = useState("Checking WebXR support...");
  const [starting, setStarting] = useState(false);
  const [supported, setSupported] = useState(false);
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    let active = true;
    async function checkSupport() {
      preloadModel();
      const ok = Boolean(navigator.xr && (await navigator.xr.isSessionSupported("immersive-ar")));
      if (active) {
        setSupported(ok);
        setStatus(ok ? "Tap Start to open AR camera." : "WebXR surface AR is not supported.");
      }
    }
    checkSupport().catch((err) => {
      console.error("[WebXR] Support check failed", err);
      if (active) setStatus("Could not check WebXR support.");
    });
    return () => {
      active = false;
      cleanupRef.current?.cleanup?.();
    };
  }, []);

  async function startWebXR() {
    if (!supported || starting) return;
    setStarting(true);
    setStatus("Starting WebXR...");

    try {
      const handles = await initWebXR(canvasRef.current, overlayRef.current, setStatus, setPlaced);
      cleanupRef.current = handles;
      setStatus("Point camera at the floor and move slowly.");
    } catch (err) {
      console.error("[WebXR] Start failed", err);
      setStatus(err?.message || "Could not start WebXR AR.");
      setStarting(false);
    }
  }

  return (
    <div className="ar-stage">
      <canvas ref={canvasRef} className="ar-stage__canvas" />
      
      {!starting && (
        <div className="ar-stage__prestart">
          <div className="ar-stage__prestart-badge">Surface AR</div>
          <h2>Ready to scan</h2>
          <p>Tap Start to open the real AR camera.</p>
        </div>
      )}

      <div ref={overlayRef} className="xr-overlay">
        <div className="ar-topbar" style={{ display: 'grid', gridTemplateColumns: '1fr', zIndex: 12 }}>
          <div style={{ textAlign: 'center', pointerEvents: 'auto' }}>{status}</div>
        </div>
        <div className="ar-actions">
          {!starting && (
            <button onClick={startWebXR} disabled={!supported}>
              Start Surface AR
            </button>
          )}
          {starting && placed && (
            <button onClick={() => cleanupRef.current?.reset?.()}>Reset Placement</button>
          )}
        </div>
      </div>
    </div>
  );
}

async function initWebXR(canvas, overlayRoot, setStatus, setPlaced) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  
  // Model-viewer exact tone mapping and exposure
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.3;
  
  renderer.xr.enabled = true;
  renderer.domElement.style.background = "transparent";
  renderer.setClearColor(0x000000, 0);
  renderer.setClearAlpha(0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = null;
  const camera = new THREE.PerspectiveCamera();

  // Model-viewer style lighting (ambient + directional for shadows)
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(2, 5, 2);
  light.castShadow = true;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.shadow.bias = -0.0005;
  light.shadow.radius = 1.5;
  scene.add(light);

  const model = await loadModel();
  model.visible = false;
  scene.add(model);

  // Model-viewer shadow surface logic
  const shadowSurface = new THREE.Group();
  const shadowGeo = new THREE.PlaneGeometry(10, 10);
  const shadowMat = new THREE.ShadowMaterial({
    color: 0x000000,
    opacity: 0.8, // AR_SHADOW_INTENSITY from model-viewer
    transparent: true,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.receiveShadow = true;
  shadowSurface.add(shadow);
  shadowSurface.visible = false;
  scene.add(shadowSurface);

  // 1. PlacementBox from model-viewer
  const box = new THREE.Box3().setFromObject(model);
  const placementBox = new PlacementBox(box);
  placementBox.visible = false;
  scene.add(placementBox);

  const hitPosition = new THREE.Vector3();
  const hitQuaternion = new THREE.Quaternion();
  const hitScale = new THREE.Vector3();
  const hitMatrix = new THREE.Matrix4();
  
  let isPlaced = false;
  let hasSurface = false;
  let interactionTimer = performance.now() + 500;

  const sessionInit = { requiredFeatures: ["hit-test"] };
  if (overlayRoot) {
    sessionInit.optionalFeatures = ["dom-overlay"];
    sessionInit.domOverlay = { root: overlayRoot };
  }

  const session = await navigator.xr.requestSession("immersive-ar", sessionInit);
  renderer.xr.setReferenceSpaceType("local");
  await renderer.xr.setSession(session);

  const referenceSpace = await session.requestReferenceSpace("local");
  const viewerSpace = await session.requestReferenceSpace("viewer");
  const hitTestSource = await session.requestHitTestSource({ space: viewerSpace });

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }

  function placeModel() {
    if (!hasSurface || isPlaced) return;
    if (performance.now() < interactionTimer) return;

    model.position.copy(placementBox.position);
    model.quaternion.copy(placementBox.quaternion);
    shadowSurface.position.copy(model.position);
    shadowSurface.quaternion.copy(model.quaternion);
    
    shadowSurface.visible = true;
    model.visible = true;
    isPlaced = true;
    placementBox.show = false;
    
    setStatus("Model placed. Use 2 fingers to scale/rotate.");
    setPlaced(true);
  }

  // Model-viewer exact 2-finger gesture logic
  let touchStartDist = 0;
  let initialScale = 1;
  let touchStartAngle = 0;
  let initialYaw = 0;
  let isTwoFingering = false;

  function onTouchStart(e) {
    if (e.touches.length === 2) {
      isTwoFingering = true;
      const dx = e.touches[0].pageX - e.touches[1].pageX;
      const dy = e.touches[0].pageY - e.touches[1].pageY;
      touchStartDist = Math.sqrt(dx*dx + dy*dy);
      touchStartAngle = Math.atan2(dy, dx);
      initialScale = model.scale.x;
      
      const euler = new THREE.Euler().setFromQuaternion(model.quaternion, 'YXZ');
      initialYaw = euler.y;
    }
  }

  function onTouchMove(e) {
    if (e.touches.length === 2 && isPlaced && isTwoFingering) {
      const dx = e.touches[0].pageX - e.touches[1].pageX;
      const dy = e.touches[0].pageY - e.touches[1].pageY;
      
      // Scaling
      const dist = Math.sqrt(dx*dx + dy*dy);
      const scaleFactor = dist / touchStartDist;
      let newScale = initialScale * scaleFactor;
      newScale = Math.max(0.05, Math.min(newScale, 15.0));
      model.scale.setScalar(newScale);

      // Rotation (Yaw)
      const currentAngle = Math.atan2(dy, dx);
      let deltaYaw = currentAngle - touchStartAngle;
      
      const euler = new THREE.Euler().setFromQuaternion(model.quaternion, 'YXZ');
      euler.y = initialYaw - deltaYaw;
      model.quaternion.setFromEuler(euler);
      shadowSurface.quaternion.copy(model.quaternion);
    }
  }
  
  function onTouchEnd(e) {
    if (e.touches.length < 2) {
      isTwoFingering = false;
    }
  }

  session.addEventListener("select", placeModel);
  window.addEventListener("resize", resize);
  window.addEventListener("touchstart", onTouchStart);
  window.addEventListener("touchmove", onTouchMove);
  window.addEventListener("touchend", onTouchEnd);

  let lastTime = performance.now();

  renderer.setAnimationLoop((time, frame) => {
    renderer.setClearAlpha(0);
    const delta = (time - lastTime) / 1000;
    lastTime = time;

    if (frame) {
      const hits = frame.getHitTestResults(hitTestSource);
      if (hits.length > 0 && !isPlaced) {
        const pose = hits[0].getPose(referenceSpace);
        hitMatrix.fromArray(pose.transform.matrix);
        hitMatrix.decompose(hitPosition, hitQuaternion, hitScale);

        // Smoothly interpolate PlacementBox just like model-viewer's Damper does
        if (!hasSurface) {
          placementBox.position.copy(hitPosition);
          placementBox.quaternion.copy(hitQuaternion);
          placementBox.show = true;
          hasSurface = true;
          setStatus("Surface found. Tap to place.");
        } else {
          placementBox.position.lerp(hitPosition, 0.2);
          placementBox.quaternion.slerp(hitQuaternion, 0.2);
        }
        
        // Ensure glowing box renders horizontally
        const euler = new THREE.Euler().setFromQuaternion(placementBox.quaternion, 'YXZ');
        euler.x = 0; 
        euler.z = 0;
        placementBox.quaternion.setFromEuler(euler);
      } else if (!isPlaced && hasSurface) {
        // Lost tracking briefly
        placementBox.show = false;
        hasSurface = false;
        setStatus("Lost surface tracking. Move phone slightly.");
      }
    }
    
    // Update PlacementBox opacity logic
    placementBox.update(delta);
    
    renderer.render(scene, camera);
  });

  return {
    cleanup: () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", resize);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      session.removeEventListener("select", placeModel);
      hitTestSource.cancel?.();
      if (session.end) session.end().catch(() => {});
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          materials.forEach((mat) => mat.dispose());
        }
      });
      renderer.dispose();
    },
    reset: () => {
      isPlaced = false;
      hasSurface = false;
      interactionTimer = performance.now() + 500;
      model.visible = false;
      shadowSurface.visible = false;
      placementBox.show = false;
      setPlaced(false);
      setStatus("Point camera at the floor and move slowly.");
    }
  };
}

function preloadModel() {
  if (!modelAssetPromise) {
    modelAssetPromise = (async () => {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("/draco/gltf/");
      dracoLoader.setDecoderConfig({ type: "wasm" });

      const loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);
      const gltf = await loader.loadAsync(MODEL_URL);
      dracoLoader.dispose();

      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = box.getSize(new THREE.Vector3());
      const maxAxis = Math.max(size.x, size.y, size.z) || 1;
      return { scene: gltf.scene, maxAxis };
    })();
  }
  return modelAssetPromise;
}

async function loadModel() {
  const asset = await preloadModel();
  const model = asset.scene.clone(true);
  
  model.traverse((child) => {
    if (!child.isMesh) return;
    if (child.geometry) child.geometry = child.geometry.clone();
    if (Array.isArray(child.material)) {
      child.material = child.material.map((m) => m.clone());
    } else if (child.material) {
      child.material = child.material.clone();
    }
    child.castShadow = true;
    child.receiveShadow = true;
  });

  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z) || 1;
  model.scale.setScalar(NORMALIZED_MODEL_SIZE / maxAxis);
  model.updateWorldMatrix(true, true);

  const scaledBox = new THREE.Box3().setFromObject(model);
  const scaledCenter = scaledBox.getCenter(new THREE.Vector3());
  model.position.x -= scaledCenter.x;
  model.position.z -= scaledCenter.z;
  model.position.y -= scaledBox.min.y;

  model.scale.multiplyScalar(MODEL_SCALE);
  return model;
}
