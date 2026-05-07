import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const MODEL_URL = "/models/10.glb";
const MODEL_SCALE = 0.8;
const NORMALIZED_MODEL_SIZE = 1.25;
const FALLBACK_MODEL_VIEWER_SCALE = 0.08;
const SIMULATOR_CAMERA_ORBIT = "0deg 66.8deg 3.8m";
const SIMULATOR_CAMERA_TARGET = "0m 0.25m 0m";
const SIMULATOR_FIELD_OF_VIEW = "50deg";
const SIMULATOR_SHADOW_INTENSITY = "1.35";
const SIMULATOR_SHADOW_SOFTNESS = "0.35";

export default function ThreeARScene() {
  const [mode, setMode] = useState("home");

  return (
    <div className="ar-app">
      {mode === "home" && <HomeScreen onMode={setMode} />}
      {mode === "webxr" && <WebXRSurfaceMode onBack={() => setMode("home")} />}
      {mode === "preview" && <Desktop3DMode onBack={() => setMode("home")} />}
      {mode === "native" && <NativeModelViewerMode onBack={() => setMode("home")} />}
      {mode === "marker" && <MarkerARMode onBack={() => setMode("home")} />}
    </div>
  );
}

function HomeScreen({ onMode }) {
  return (
    <div className="ar-home">
      <div className="ar-home__badge">AR</div>
      <h1>Aroma AR</h1>
      <p>Use the simulator to tune scale and shadows, then launch real surface AR on a supported phone.</p>

      <div className="ar-mode-list">
        <button className="ar-mode-card is-primary" onClick={() => onMode("native")}>
          <span>Real Surface AR</span>
          <small>Model Viewer places the dish on a detected real table or floor.</small>
        </button>
        <button className="ar-mode-card" onClick={() => onMode("preview")}>
          <span>Surface Simulator</span>
          <small>Fake Three.js floor for adjusting size, lighting, and shadows.</small>
        </button>
        <button className="ar-mode-card" onClick={() => onMode("webxr")}>
          <span>WebXR Hit-Test</span>
          <small>Experimental browser-only hit-test path for devices with working WebXR passthrough.</small>
        </button>
        <button className="ar-mode-card" onClick={() => onMode("marker")}>
          <span>Browser Marker AR</span>
          <small>Stays in page with AR.js. Needs the Hiro marker.</small>
        </button>
      </div>
    </div>
  );
}

function WebXRSurfaceMode({ onBack }) {
  const canvasRef = useRef(null);
  const cleanupRef = useRef(null);
  const modelRef = useRef(null);
  const reticleRef = useRef(null);
  const [status, setStatus] = useState("Checking WebXR support...");
  const [starting, setStarting] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    let active = true;
    async function checkSupport() {
      const ok = Boolean(navigator.xr && (await navigator.xr.isSessionSupported("immersive-ar")));
      if (active) {
        setSupported(ok);
        setStatus(ok ? "Tap Start, scan the floor, then tap when the ring appears." : "WebXR surface AR is not supported in this browser.");
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
      const handles = await initWebXR(canvasRef.current, setStatus, modelRef, reticleRef);
      cleanupRef.current = handles;
      setStatus("Move slowly. Tap the floor when the ring appears.");
      console.log("[WebXR] Surface mode started");
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
          <p>
            Tap Start to open the real AR camera. The camera feed appears only after the
            WebXR session begins.
          </p>
        </div>
      )}
      <div className="ar-topbar">
        <button onClick={onBack}>Back</button>
        <div>{status}</div>
      </div>
      <div className="ar-actions">
        {!starting && (
          <button onClick={startWebXR} disabled={!supported}>
            Start Surface AR
          </button>
        )}
        {starting && <button onClick={() => cleanupRef.current?.reset?.()}>Reset</button>}
      </div>
    </div>
  );
}

async function initWebXR(canvas, setStatus, modelRef, reticleRef) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.xr.enabled = true;
  renderer.domElement.style.background = "transparent";
  renderer.setClearColor(0x000000, 0);
  renderer.setClearAlpha(0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = null;
  const camera = new THREE.PerspectiveCamera();

  // Apply the same moody cinematic lighting and drop-shadow physics to WebXR
  scene.add(new THREE.AmbientLight(0x404050, 0.6));
  const light = new THREE.DirectionalLight(0xfff0dd, 3.5);
  light.position.set(0, 10, 0); // Overhead for perfect drop shadow
  light.castShadow = true;
  light.shadow.camera.left = -10;
  light.shadow.camera.right = 10;
  light.shadow.camera.top = 10;
  light.shadow.camera.bottom = -10;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 25;
  light.shadow.mapSize.width = 2048;
  light.shadow.mapSize.height = 2048;
  light.shadow.bias = -0.0005;
  light.shadow.radius = 1.5;
  scene.add(light);

  const model = await loadModel();
  model.visible = false;
  scene.add(model);
  modelRef.current = model;

  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.08, 0.105, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);
  reticleRef.current = reticle;

  const session = await navigator.xr.requestSession("immersive-ar", {
    requiredFeatures: ["hit-test"],
    optionalFeatures: ["dom-overlay"],
    domOverlay: { root: document.body },
  });
  renderer.xr.setReferenceSpaceType("local");
  await renderer.xr.setSession(session);

  const referenceSpace = await session.requestReferenceSpace("local");
  const viewerSpace = await session.requestReferenceSpace("viewer");
  const hitTestSource = await session.requestHitTestSource({ space: viewerSpace });

  function resize() {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }

  let isPlaced = false;

  function placeModel() {
    if (!reticle.visible || isPlaced) return;
    
    model.position.setFromMatrixPosition(reticle.matrix);
    model.quaternion.setFromRotationMatrix(reticle.matrix);
    model.visible = true;
    isPlaced = true;
    reticle.visible = false;
    setStatus("Locked! Use two fingers to scale the dish.");
  }

  // Touch pinch to scale in WebXR
  let touchStartDist = 0;
  let initialScale = 1;

  function onTouchStart(e) {
    if (e.touches.length === 2) {
      const dx = e.touches[0].pageX - e.touches[1].pageX;
      const dy = e.touches[0].pageY - e.touches[1].pageY;
      touchStartDist = Math.sqrt(dx*dx + dy*dy);
      initialScale = model.scale.x;
    }
  }

  function onTouchMove(e) {
    if (e.touches.length === 2 && isPlaced) {
      const dx = e.touches[0].pageX - e.touches[1].pageX;
      const dy = e.touches[0].pageY - e.touches[1].pageY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const scaleFactor = dist / touchStartDist;
      
      let newScale = initialScale * scaleFactor;
      newScale = Math.max(0.05, Math.min(newScale, 15.0));
      model.scale.setScalar(newScale);
    }
  }

  session.addEventListener("select", placeModel);
  window.addEventListener("resize", resize);
  window.addEventListener("touchstart", onTouchStart);
  window.addEventListener("touchmove", onTouchMove);

  renderer.setAnimationLoop((_, frame) => {
    renderer.setClearAlpha(0);
    if (frame) {
      const hits = frame.getHitTestResults(hitTestSource);
      if (hits.length > 0 && !isPlaced) {
        const pose = hits[0].getPose(referenceSpace);
        reticle.visible = true;
        reticle.matrix.fromArray(pose.transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
    renderer.render(scene, camera);
  });

  return {
    cleanup: () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", resize);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      session.removeEventListener("select", placeModel);
      hitTestSource.cancel?.();
      if (session.end) session.end().catch(() => {});
      disposeWorld(scene);
      renderer.dispose();
      modelRef.current = null;
      reticleRef.current = null;
    },
    reset: () => {
      isPlaced = false;
      if (modelRef.current) modelRef.current.visible = false;
      setStatus("Move slowly. Tap the floor when the ring appears.");
    }
  };
}

function NativeModelViewerMode({ onBack }) {
  const canvasRef = useRef(null);
  const cleanupRef = useRef(null);
  const modelViewerRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(Boolean(customElements.get("model-viewer")));
  const [modelViewerScale, setModelViewerScale] = useState(FALLBACK_MODEL_VIEWER_SCALE);
  const [status, setStatus] = useState("Tap anywhere on the floor to place the dish.");
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    if (customElements.get("model-viewer")) return;

    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
    script.onload = () => setScriptReady(true);
    script.onerror = () => console.error("[model-viewer] Could not load model-viewer script");
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    let active = true;
    getModelViewerScale()
      .then((scale) => {
        if (active) setModelViewerScale(scale);
      })
      .catch((err) => console.warn("[model-viewer] Could not calculate normalized scale", err));

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      const handles = await initDesktop3D(canvasRef.current, setStatus, setPlaced);
      if (active) cleanupRef.current = handles;
      else handles.cleanup();
    }
    init();

    return () => {
      active = false;
      cleanupRef.current?.cleanup();
    };
  }, []);

  const scaleAttribute = formatVectorScale(modelViewerScale);

  function launchRealSurfaceAR() {
    if (!scriptReady || !modelViewerRef.current?.activateAR) {
      setStatus("AR is still loading. Try again in a moment.");
      return;
    }
    modelViewerRef.current.activateAR();
  }

  return (
    <div className="native-viewer native-viewer--simulator">
      <canvas ref={canvasRef} className="ar-stage__canvas" />
      <div className="ar-topbar">
        <button onClick={onBack}>Back</button>
        <div>{status}</div>
      </div>

      {scriptReady ? (
        <model-viewer
          ref={modelViewerRef}
          src={MODEL_URL}
          alt="Bong Kebab"
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-placement="floor"
          ar-scale="fixed"
          scale={scaleAttribute}
          camera-orbit={SIMULATOR_CAMERA_ORBIT}
          camera-target={SIMULATOR_CAMERA_TARGET}
          field-of-view={SIMULATOR_FIELD_OF_VIEW}
          min-field-of-view="18deg"
          max-field-of-view="65deg"
          camera-controls
          interaction-prompt="auto"
          environment-image="neutral"
          xr-environment
          shadow-intensity={SIMULATOR_SHADOW_INTENSITY}
          shadow-softness={SIMULATOR_SHADOW_SOFTNESS}
          exposure="1"
          className="native-viewer__ar-host"
        >
          <button slot="ar-button" className="native-viewer__hidden-ar-button">Open AR</button>
        </model-viewer>
      ) : (
        <div className="native-viewer__loading">Loading model-viewer...</div>
      )}

      <div className="ar-actions ar-actions--stack">
        {placed && <button onClick={() => cleanupRef.current?.reset()}>Reset Position</button>}
        <button onClick={launchRealSurfaceAR} disabled={!scriptReady}>
          View on Real Surface
        </button>
      </div>
    </div>
  );
}

function MarkerARMode({ onBack }) {
  return (
    <div className="marker-mode">
      <iframe title="AR.js marker mode" src="/marker-ar.html" allow="camera; fullscreen; xr-spatial-tracking" />
      <div className="ar-topbar">
        <button onClick={onBack}>Back</button>
        <div>Point camera at the Hiro marker</div>
      </div>
      <a className="marker-mode__marker" href="https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png" target="_blank" rel="noreferrer">
        Open Hiro marker
      </a>
    </div>
  );
}

async function getModelViewerScale() {
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
  disposeWorld(gltf.scene);

  return (NORMALIZED_MODEL_SIZE / maxAxis) * MODEL_SCALE;
}

function formatVectorScale(scale) {
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : FALLBACK_MODEL_VIEWER_SCALE;
  const value = safeScale.toFixed(5);
  return `${value} ${value} ${value}`;
}

async function loadModel() {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/gltf/");
  dracoLoader.setDecoderConfig({ type: "wasm" });

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);
  const gltf = await loader.loadAsync(MODEL_URL);
  dracoLoader.dispose();

  const model = gltf.scene;
  normalizeModel(model);
  model.scale.multiplyScalar(MODEL_SCALE);
  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    if (child.material) child.material.needsUpdate = true;
  });
  return model;
}

function normalizeModel(model) {
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
}

function disposeWorld(scene) {
  scene.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      materials.forEach((mat) => mat.dispose());
    }
  });
}

function Desktop3DMode({ onBack }) {
  const canvasRef = useRef(null);
  const cleanupRef = useRef(null);
  const [status, setStatus] = useState("Tap anywhere on the floor to place the dish.");
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    let active = true;
    async function init() {
      const handles = await initDesktop3D(canvasRef.current, setStatus, setPlaced);
      if (active) cleanupRef.current = handles;
      else handles.cleanup();
    }
    init();
    return () => {
      active = false;
      cleanupRef.current?.cleanup();
    };
  }, []);

  return (
    <div className="ar-stage">
      <canvas ref={canvasRef} className="ar-stage__canvas" />
      <div className="ar-topbar">
        <button onClick={onBack}>Back</button>
        <div>{status}</div>
      </div>
      
      <div className="ar-actions" style={{ flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
        {placed && <button onClick={() => cleanupRef.current?.reset()}>Reset Position</button>}
      </div>
    </div>
  );
}

async function initDesktop3D(canvas, setStatus, setPlaced) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a24);
  scene.fog = new THREE.Fog(0x1a1a24, 2, 20);

  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.5, 2.5);
  camera.lookAt(0, 0, -1);

  // Soft ambient fill light (cool tone)
  scene.add(new THREE.AmbientLight(0x404050, 0.6)); // Reduced to make the shadow much darker

  // Main directional light (warm tone) angled straight down
  const light = new THREE.DirectionalLight(0xfff0dd, 3.5);
  light.position.set(0, 10, 0); // Positioned directly overhead for a perfect drop-shadow
  light.castShadow = true;
  
  // Expand the shadow camera so shadows are cast even when dish is moved far away
  light.shadow.camera.left = -10;
  light.shadow.camera.right = 10;
  light.shadow.camera.top = 10;
  light.shadow.camera.bottom = -10;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 25;
  
  light.shadow.mapSize.width = 2048; // High-res shadow
  light.shadow.mapSize.height = 2048;
  light.shadow.bias = -0.0005;
  light.shadow.radius = 1.5; // Slightly sharper, pronounced shadow edge to match reference
  scene.add(light);

  const floorGeo = new THREE.PlaneGeometry(100, 100);
  const floorMat = new THREE.MeshStandardMaterial({ 
    color: 0x555555, // Darkened floor to match the moody reference picture
    roughness: 0.9,
    metalness: 0.1
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Add grid for better depth perception
  const grid = new THREE.GridHelper(100, 200, 0x888888, 0x333333);
  grid.position.y = 0.001;
  scene.add(grid);

  const model = await loadModel();
  model.position.set(0, 0, -1);
  scene.add(model);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  
  let isPlaced = false;

  function onPointerDown(event) {
    if (event.target !== canvas) return; // ignore clicks on buttons
    if (isPlaced) return; // lock position after first placement

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(floor);
    if (intersects.length > 0) {
      model.position.copy(intersects[0].point);
      model.position.y = 0;
      isPlaced = true;
      setStatus("Dish locked in place. Use trackpad to zoom in/out.");
      setPlaced(true);
    }
  }

  function onWheel(event) {
    event.preventDefault();
    // Trackpad pinch-to-zoom triggers wheel events. 
    // deltaY < 0 is zooming in, deltaY > 0 is zooming out.
    const zoomSpeed = 0.005;
    const zoomFactor = 1 - (event.deltaY * zoomSpeed);
    
    // Protect against huge jumps
    const safeFactor = Math.max(0.8, Math.min(zoomFactor, 1.2));
    
    model.scale.multiplyScalar(safeFactor);
    
    // Clamp scale to reasonable limits
    const maxS = 15.0;
    const minS = 0.05;
    if (model.scale.x > maxS) model.scale.setScalar(maxS);
    if (model.scale.x < minS) model.scale.setScalar(minS);
  }

  window.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('wheel', onWheel, { passive: false });

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }
  window.addEventListener('resize', resize);

  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });

  return {
    cleanup: () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', resize);
      disposeWorld(scene);
      renderer.dispose();
    },
    reset: () => {
      isPlaced = false;
      model.position.set(0, 0, -1);
      setStatus("Tap anywhere on the floor to place the dish.");
      setPlaced(false);
    }
  };
}
