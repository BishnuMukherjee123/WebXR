import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { PlacementBox } from "./PlacementBox";
import { Damper } from "./Damper";

const MODELS = [
  { name: 'Bong Kebab', glb: '/models/10.glb', webp: '' },
  { name: 'Chair', glb: '../../assets/ShopifyModels/Chair.glb', webp: '' },
  { name: 'Mixer', glb: '../../assets/ShopifyModels/Mixer.glb', webp: '' },
  { name: 'GeoPlanter', glb: '../../assets/ShopifyModels/GeoPlanter.glb', webp: '' },
  { name: 'ToyTrain', glb: '../../assets/ShopifyModels/ToyTrain.glb', webp: '' },
  { name: 'Canoe', glb: '../../assets/ShopifyModels/Canoe.glb', webp: '' }
];

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
  const [currentModel, setCurrentModel] = useState(MODELS[0]);

  useEffect(() => {
    let active = true;
    async function checkSupport() {
      preloadModel(currentModel.glb);
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
  }, [currentModel]);

  // Run the Desktop fallback / SmoothControls when not in AR
  useEffect(() => {
    if (starting) return;
    let active = true;
    async function initDesktop() {
      if (!canvasRef.current) return;
      cleanupRef.current?.cleanup?.();
      try {
        const handles = await initDesktopView(canvasRef.current, currentModel.glb);
        if (active) cleanupRef.current = handles;
        else handles.cleanup();
      } catch (err) {
        console.error("Desktop view failed to load", err);
      }
    }
    initDesktop();
    return () => {
      active = false;
      cleanupRef.current?.cleanup?.();
    };
  }, [starting, currentModel]);

  async function startWebXR() {
    if (!supported || starting) return;
    setStarting(true);
    setStatus("Starting WebXR...");

    try {
      cleanupRef.current?.cleanup?.();
      const handles = await initWebXR(canvasRef.current, overlayRef.current, setStatus, setPlaced, currentModel.glb);
      cleanupRef.current = handles;
      setStatus("Point camera at the floor and move slowly.");
    } catch (err) {
      console.error("[WebXR] Start failed", err);
      setStatus(err?.message || "Could not start WebXR AR.");
      setStarting(false);
    }
  }

  return (
    <div className="marker-ar-root" style={{ width: '100vw', height: '100dvh', position: 'fixed', inset: 0, overflow: 'hidden' }}>
      <canvas ref={canvasRef} className="ar-stage__canvas" style={{ width: '100%', height: '100%', display: 'block' }} />
      
      {!starting && (
        <div className="ar-stage__prestart" style={{ position: 'absolute', top: '15%', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none', zIndex: 5 }}>
          <div className="ar-stage__prestart-badge" style={{ display: 'inline-block', padding: '4px 8px', background: '#333', color: '#fff', borderRadius: '4px' }}>Surface AR</div>
          <h2 style={{ color: '#111', marginTop: '16px' }}>Ready to scan</h2>
        </div>
      )}

      <div ref={overlayRef} className="xr-overlay" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
        <div className="ar-topbar" style={{ display: 'grid', gridTemplateColumns: '1fr', zIndex: 12 }}>
          <div style={{ textAlign: 'center', pointerEvents: 'auto' }}>{status}</div>
        </div>
        
        {/* XRMenuPanel exact UI slots */}
        {starting && !placed && (
          <div id="ar-prompt" style={{ display: 'block' }}>
            <img src="../../assets/hand.png" alt="Hand prompt" />
          </div>
        )}

        {!starting && (
          <button id="ar-button" onClick={startWebXR} disabled={!supported} style={{ pointerEvents: 'auto' }}>
            Start Surface AR
          </button>
        )}
        
        {starting && placed && (
          <button onClick={() => cleanupRef.current?.reset?.()} style={{ position: 'absolute', top: '70px', left: '50%', transform: 'translateX(-50%)', padding: '8px 16px', pointerEvents: 'auto', borderRadius: '20px', border: 'none', background: '#fff', color: '#111', fontWeight: 'bold' }}>
            Reset Placement
          </button>
        )}

        {/* Carousel UI */}
        <div className="slider" onPointerDown={(e) => e.stopPropagation()} style={{ pointerEvents: 'auto' }}>
          <div className="slides">
            {MODELS.map((model) => (
              <button
                key={model.name}
                className={`slide ${currentModel.name === model.name ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentModel(model);
                }}
                style={{
                  backgroundImage: model.webp ? `url('${model.webp}')` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: '#111',
                  backgroundColor: '#fff',
                  border: currentModel.name === model.name ? '2px solid #4285f4' : '1px solid #ccc'
                }}
              >
                {!model.webp && model.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// DESKTOP PREVIEW (Matches SmoothControls.ts)
// ==========================================
async function initDesktopView(canvas, modelUrl) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#eee');

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment()).texture;

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.5, 3.5);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 0.5;
  controls.maxDistance = 10;
  controls.target.set(0, 0.25, 0);

  const model = await loadModel(modelUrl);
  scene.add(model);

  const shadowSurface = new THREE.Group();
  const shadowGeo = new THREE.PlaneGeometry(10, 10);
  const shadowMat = new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.8, transparent: true, depthWrite: false });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.receiveShadow = true;
  shadowSurface.add(shadow);
  scene.add(shadowSurface);

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);

  renderer.setAnimationLoop(() => {
    controls.update();
    renderer.render(scene, camera);
  });

  return {
    cleanup: () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", resize);
      controls.dispose();
      renderer.dispose();
      pmremGenerator.dispose();
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach(m => m.dispose());
        }
      });
    }
  };
}

// ==========================================
// AR RENDERER (Matches ARRenderer.ts & XRMenuPanel)
// ==========================================
async function initWebXR(canvas, overlayRoot, setStatus, setPlaced, modelUrl) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.xr.enabled = true;
  renderer.setClearColor(0x000000, 0);
  renderer.setClearAlpha(0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = null;

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment()).texture;

  const camera = new THREE.PerspectiveCamera();

  const light = new THREE.DirectionalLight(0xffffff, 1.0);
  light.position.set(2, 5, 2);
  light.castShadow = true;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.shadow.bias = -0.0005;
  light.shadow.radius = 1.5;
  scene.add(light);

  const model = await loadModel(modelUrl);
  model.visible = false;
  scene.add(model);

  const shadowSurface = new THREE.Group();
  const shadowGeo = new THREE.PlaneGeometry(10, 10);
  const shadowMat = new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.8, transparent: true, depthWrite: false });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.receiveShadow = true;
  shadowSurface.add(shadow);
  shadowSurface.visible = false;
  scene.add(shadowSurface);

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

  const xDamper = new Damper();
  const yDamper = new Damper();
  const zDamper = new Damper();
  const yawDamper = new Damper();
  
  let goalX = 0;
  let goalY = 0;
  let goalZ = 0;
  let goalYaw = 0;

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
      
      const dist = Math.sqrt(dx*dx + dy*dy);
      const scaleFactor = dist / touchStartDist;
      let newScale = initialScale * scaleFactor;
      newScale = Math.max(0.05, Math.min(newScale, 15.0));
      model.scale.setScalar(newScale);

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
    const deltaMs = time - lastTime;
    const delta = deltaMs / 1000;
    lastTime = time;

    if (frame) {
      const hits = frame.getHitTestResults(hitTestSource);
      if (hits.length > 0 && !isPlaced) {
        const pose = hits[0].getPose(referenceSpace);
        hitMatrix.fromArray(pose.transform.matrix);
        hitMatrix.decompose(hitPosition, hitQuaternion, hitScale);

        goalX = hitPosition.x;
        goalY = hitPosition.y;
        goalZ = hitPosition.z;
        const euler = new THREE.Euler().setFromQuaternion(hitQuaternion, 'YXZ');
        goalYaw = euler.y;

        if (!hasSurface) {
          placementBox.position.copy(hitPosition);
          placementBox.quaternion.copy(hitQuaternion);
          placementBox.show = true;
          hasSurface = true;
          setStatus("Surface found. Tap to place.");
        } else {
          placementBox.position.x = xDamper.update(placementBox.position.x, goalX, deltaMs, 1);
          placementBox.position.y = yDamper.update(placementBox.position.y, goalY, deltaMs, 1);
          placementBox.position.z = zDamper.update(placementBox.position.z, goalZ, deltaMs, 1);
          
          const curEuler = new THREE.Euler().setFromQuaternion(placementBox.quaternion, 'YXZ');
          curEuler.y = yawDamper.update(curEuler.y, goalYaw, deltaMs, Math.PI);
          curEuler.x = 0; 
          curEuler.z = 0;
          placementBox.quaternion.setFromEuler(curEuler);
        }
      } else if (!isPlaced && hasSurface) {
        placementBox.show = false;
        hasSurface = false;
        setStatus("Lost surface tracking. Move phone slightly.");
      }
    }
    
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
      pmremGenerator.dispose();
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

let loadedModelsCache = {};

function preloadModel(modelUrl) {
  if (!loadedModelsCache[modelUrl]) {
    loadedModelsCache[modelUrl] = (async () => {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath("/draco/gltf/");
      dracoLoader.setDecoderConfig({ type: "wasm" });

      const loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);
      const gltf = await loader.loadAsync(modelUrl);
      dracoLoader.dispose();

      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = box.getSize(new THREE.Vector3());
      const maxAxis = Math.max(size.x, size.y, size.z) || 1;
      return { scene: gltf.scene, maxAxis };
    })();
  }
  return loadedModelsCache[modelUrl];
}

async function loadModel(modelUrl) {
  const asset = await preloadModel(modelUrl);
  
  // NOTE: Simply use a lightweight clone to avoid breaking Draco geometries!
  const model = asset.scene.clone(); 
  
  model.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
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
