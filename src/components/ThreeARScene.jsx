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
const LOW_LIGHT_FALLBACK_DELAY = 4200;
const LOW_LIGHT_MANUAL_DISTANCE = 1.15;
const LOW_LIGHT_MANUAL_DROP = 0.72;
const WEBXR_TAP_ARM_DELAY = 850;
let modelAssetPromise;
let modelViewerScalePromise;

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
        <button className="ar-mode-card is-primary" onClick={() => onMode("webxr")}>
          <span>Real Surface AR</span>
          <small>Custom Three.js WebXR uses the same floor, grid, shadows, and tap lock as the simulator.</small>
        </button>
        <button className="ar-mode-card" onClick={() => onMode("preview")}>
          <span>Surface Simulator</span>
          <small>Fake Three.js floor for adjusting size, lighting, and shadows.</small>
        </button>
        <button className="ar-mode-card" onClick={() => onMode("native")}>
          <span>Model Viewer Fallback</span>
          <small>Native AR launcher for devices where browser WebXR passthrough fails.</small>
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
  const overlayRef = useRef(null);
  const cleanupRef = useRef(null);
  const modelRef = useRef(null);
  const reticleRef = useRef(null);
  const [status, setStatus] = useState("Checking WebXR support...");
  const [starting, setStarting] = useState(false);
  const [supported, setSupported] = useState(false);
  const [lowLightAvailable, setLowLightAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    async function checkSupport() {
      preloadModel();
      const ok = Boolean(navigator.xr && (await navigator.xr.isSessionSupported("immersive-ar")));
      if (active) {
        setSupported(ok);
        setStatus(ok ? "Tap Start, scan the surface, then tap to place." : "WebXR surface AR is not supported in this browser.");
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
    setLowLightAvailable(false);
    setStatus("Starting WebXR...");

    try {
      const handles = await initWebXR(canvasRef.current, overlayRef.current, setStatus, modelRef, reticleRef);
      handles.onLowLightAvailable = setLowLightAvailable;
      cleanupRef.current = handles;
      setStatus(handles.scanStatus);
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
      <div ref={overlayRef} className="xr-overlay">
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
          {starting && lowLightAvailable && (
            <button onClick={() => cleanupRef.current?.placeWithoutSurface?.()}>
              Low-Light Place
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

async function initWebXR(canvas, overlayRoot, setStatus, modelRef, reticleRef, options = {}) {
  const scanStatus = options.scanStatus || "Move slowly, then tap the surface.";
  const foundStatus = options.foundStatus || "Surface found. Tap the floor to lock the dish.";
  const trackingStatus = options.trackingStatus || "Move slowly over a textured floor or table.";
  const placedStatus = options.placedStatus || "Dish locked in place. Use two fingers to zoom in/out.";
  const lowLightPlacedStatus = options.lowLightPlacedStatus || "Placed with low-light assist. Use two fingers to zoom in/out.";

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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = null;
  const camera = new THREE.PerspectiveCamera();

  // Apply the same moody cinematic lighting and drop-shadow physics to WebXR
  scene.add(new THREE.AmbientLight(0x606070, 0.85));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x34343f, 0.7));
  const light = new THREE.DirectionalLight(0xfff0dd, 3.5);
  light.position.set(0, 10, 0); // Overhead for perfect drop shadow
  light.castShadow = true;
  light.shadow.camera.left = -10;
  light.shadow.camera.right = 10;
  light.shadow.camera.top = 10;
  light.shadow.camera.bottom = -10;
  light.shadow.camera.near = 0.5;
  light.shadow.camera.far = 25;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.shadow.bias = -0.0005;
  light.shadow.radius = 1.5;
  scene.add(light);

  const model = await loadModel();
  model.visible = false;
  scene.add(model);
  modelRef.current = model;

  const shadowSurface = createWebXRShadowSurface();
  shadowSurface.visible = false;
  scene.add(shadowSurface);

  const reticle = new THREE.Object3D();
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);
  reticleRef.current = reticle;
  const reticlePosition = new THREE.Vector3();
  const reticleQuaternion = new THREE.Quaternion();
  const reticleScale = new THREE.Vector3();
  const hitPosition = new THREE.Vector3();
  const hitQuaternion = new THREE.Quaternion();
  const hitScale = new THREE.Vector3();
  const hitMatrix = new THREE.Matrix4();
  const cameraPosition = new THREE.Vector3();
  const cameraDirection = new THREE.Vector3();
  const fallbackPosition = new THREE.Vector3();
  const fallbackQuaternion = new THREE.Quaternion();
  const fallbackScale = new THREE.Vector3(1, 1, 1);
  const yAxis = new THREE.Vector3(0, 1, 0);
  let stableHitFrames = 0;
  let missedHitFrames = 0;
  let hadStableHit = false;
  let surfaceReady = false;
  let lastTrackingHint = 0;
  let lowLightFallbackShown = false;
  let scanStartTime = performance.now();
  let placementArmedAt = performance.now() + WEBXR_TAP_ARM_DELAY;

  const sessionInit = { requiredFeatures: ["hit-test"] };
  if (overlayRoot) {
    sessionInit.optionalFeatures = ["dom-overlay", "light-estimation"];
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

  let isPlaced = false;

  function finishPlacement(position, quaternion, message) {
    model.position.copy(position);
    model.quaternion.copy(quaternion);
    shadowSurface.position.copy(model.position);
    shadowSurface.quaternion.copy(model.quaternion);
    shadowSurface.visible = true;
    model.visible = true;
    isPlaced = true;
    reticle.visible = false;
    handles.onLowLightAvailable?.(false);
    setStatus(message);
  }

  function placeModel() {
    if (!surfaceReady || isPlaced) return;
    if (performance.now() < placementArmedAt) return;

    reticle.matrix.decompose(hitPosition, hitQuaternion, hitScale);
    finishPlacement(hitPosition, hitQuaternion, placedStatus);
  }

  function placeWithoutSurface() {
    if (isPlaced) return;

    camera.getWorldPosition(cameraPosition);
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    if (cameraDirection.lengthSq() < 0.0001) cameraDirection.set(0, 0, -1);
    cameraDirection.normalize();

    fallbackPosition.copy(cameraPosition).addScaledVector(cameraDirection, LOW_LIGHT_MANUAL_DISTANCE);
    fallbackPosition.y = cameraPosition.y - LOW_LIGHT_MANUAL_DROP;
    fallbackQuaternion.setFromAxisAngle(yAxis, Math.atan2(cameraDirection.x, cameraDirection.z));
    reticle.matrix.compose(fallbackPosition, fallbackQuaternion, fallbackScale);
    finishPlacement(fallbackPosition, fallbackQuaternion, lowLightPlacedStatus);
  }

  function onPointerDown(event) {
    if (event.target !== canvas) return;
    if (performance.now() < placementArmedAt) return;
    placeModel();
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
  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("resize", resize);
  window.addEventListener("touchstart", onTouchStart);
  window.addEventListener("touchmove", onTouchMove);

  const handles = {
    cleanup: () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", resize);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
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
      stableHitFrames = 0;
      missedHitFrames = 0;
      hadStableHit = false;
      surfaceReady = false;
      lowLightFallbackShown = false;
      scanStartTime = performance.now();
      placementArmedAt = performance.now() + WEBXR_TAP_ARM_DELAY;
      handles.onLowLightAvailable?.(false);
      if (modelRef.current) modelRef.current.visible = false;
      shadowSurface.visible = false;
      setStatus(scanStatus);
    },
    placeWithoutSurface,
    onLowLightAvailable: null,
    scanStatus,
  };

  renderer.setAnimationLoop((_, frame) => {
    renderer.setClearAlpha(0);
    if (frame) {
      const hits = frame.getHitTestResults(hitTestSource);
      if (hits.length > 0 && !isPlaced) {
        missedHitFrames = 0;
        const pose = hits[0].getPose(referenceSpace);
        hitMatrix.fromArray(pose.transform.matrix);
        hitMatrix.decompose(hitPosition, hitQuaternion, hitScale);

        if (!reticle.visible) {
          reticlePosition.copy(hitPosition);
          reticleQuaternion.copy(hitQuaternion);
          reticleScale.copy(hitScale);
        } else {
          reticle.matrix.decompose(reticlePosition, reticleQuaternion, reticleScale);
          reticlePosition.lerp(hitPosition, 0.18);
          reticleQuaternion.slerp(hitQuaternion, 0.18);
          reticleScale.lerp(hitScale, 0.18);
        }

        stableHitFrames = Math.min(stableHitFrames + 1, 8);
        surfaceReady = stableHitFrames >= 3;
        reticle.visible = false;
        reticle.matrix.compose(reticlePosition, reticleQuaternion, reticleScale);
        if (surfaceReady && !hadStableHit) {
          hadStableHit = true;
          handles.onLowLightAvailable?.(false);
          setStatus(foundStatus);
        }
      } else {
        missedHitFrames = Math.min(missedHitFrames + 1, 12);
        if (missedHitFrames >= 6) {
          stableHitFrames = 0;
          surfaceReady = false;
          reticle.visible = false;
        }
        const now = performance.now();
        if (!isPlaced && now - lastTrackingHint > 1600) {
          lastTrackingHint = now;
          setStatus(lowLightFallbackShown ? "Low light assist is ready if the surface is not detected." : trackingStatus);
        }
        if (!isPlaced && !lowLightFallbackShown && now - scanStartTime > LOW_LIGHT_FALLBACK_DELAY) {
          lowLightFallbackShown = true;
          handles.onLowLightAvailable?.(true);
          setStatus("Low-light assist is ready. Use it if the ring does not appear.");
        }
      }
    }
    renderer.render(scene, camera);
  });

  return handles;
}

function NativeModelViewerMode({ onBack }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const cleanupRef = useRef(null);
  const modelViewerRef = useRef(null);
  const modelRef = useRef(null);
  const reticleRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(Boolean(customElements.get("model-viewer")));
  const [modelViewerScale, setModelViewerScale] = useState(FALLBACK_MODEL_VIEWER_SCALE);
  const [status, setStatus] = useState("Tap a surface to place the dish.");
  const [placed, setPlaced] = useState(false);
  const [browserArRunning, setBrowserArRunning] = useState(false);
  const [lowLightAvailable, setLowLightAvailable] = useState(false);

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
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    function onArStatus(event) {
      const arStatus = event.detail?.status;
      if (arStatus === "session-started") {
        cleanupRef.current?.pause?.();
        setStatus("Scan the wall, then tap to place the dish.");
      } else if (arStatus === "failed") {
        cleanupRef.current?.resume?.();
        setStatus("Surface tracking failed. Try a textured spot or use the simulator placement.");
      } else if (arStatus === "not-presenting") {
        cleanupRef.current?.resume?.();
        setStatus("Tap a surface to place the dish.");
      }
    }

    viewer.addEventListener("ar-status", onArStatus);
    return () => viewer.removeEventListener("ar-status", onArStatus);
  }, [scriptReady]);

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

  async function launchRealSurfaceAR() {
    if (browserArRunning) return;
    if (!navigator.xr) {
      setStatus("Browser AR is not supported on this device.");
      return;
    }

    setStatus("Starting browser AR...");
    setLowLightAvailable(false);

    try {
      const ok = await navigator.xr.isSessionSupported("immersive-ar");
      if (!ok) {
        setStatus("Browser AR is not supported on this device.");
        return;
      }

      cleanupRef.current?.cleanup?.();
      cleanupRef.current = null;
      setPlaced(false);
      setBrowserArRunning(true);

      const handles = await initWebXR(canvasRef.current, overlayRef.current, setStatus, modelRef, reticleRef, {
        scanStatus: "Move slowly, then tap the wall.",
        foundStatus: "Wall found. Tap the wall to lock the dish.",
        trackingStatus: "Move slowly over a textured wall.",
        placedStatus: "Dish locked on the wall. Use two fingers to zoom in/out.",
        lowLightPlacedStatus: "Placed with low-light assist. Use two fingers to zoom in/out.",
      });
      handles.onLowLightAvailable = setLowLightAvailable;
      cleanupRef.current = handles;
      setStatus(handles.scanStatus);
    } catch (err) {
      console.error("[model-viewer fallback] Browser AR start failed", err);
      setBrowserArRunning(false);
      setStatus(err?.message || "Could not start browser AR.");
    }
  }

  return (
    <div className="native-viewer native-viewer--simulator">
      <canvas ref={canvasRef} className="ar-stage__canvas" />
      <div ref={overlayRef} className="xr-overlay">
        <div className="ar-topbar">
          <button onClick={onBack}>Back</button>
          <div>{status}</div>
        </div>

        <div className="ar-actions ar-actions--stack">
          {placed && <button onClick={() => cleanupRef.current?.reset()}>Reset Position</button>}
          {browserArRunning && <button onClick={() => cleanupRef.current?.reset?.()}>Reset AR</button>}
          {browserArRunning && lowLightAvailable && (
            <button onClick={() => cleanupRef.current?.placeWithoutSurface?.()}>
              Low-Light Place
            </button>
          )}
          {!browserArRunning && (
            <button onClick={launchRealSurfaceAR}>
              Start Browser AR
            </button>
          )}
          {!browserArRunning && (
            <button onClick={() => setStatus("Use browser AR for tap-to-place wall placement.")}>
              Low-Light Help
            </button>
          )}
        </div>
      </div>

      {scriptReady ? (
        <model-viewer
          ref={modelViewerRef}
          src={MODEL_URL}
          alt="Bong Kebab"
          ar
          ar-modes="webxr quick-look"
          ar-placement="wall"
          ar-scale="fixed"
          scale={scaleAttribute}
          camera-orbit={SIMULATOR_CAMERA_ORBIT}
          camera-target={SIMULATOR_CAMERA_TARGET}
          field-of-view={SIMULATOR_FIELD_OF_VIEW}
          min-field-of-view="18deg"
          max-field-of-view="65deg"
          camera-controls
          interaction-prompt="none"
          environment-image="neutral"
          xr-environment
          shadow-intensity={SIMULATOR_SHADOW_INTENSITY}
          shadow-softness={SIMULATOR_SHADOW_SOFTNESS}
          exposure="1.35"
          className="native-viewer__ar-host"
        >
          <button slot="ar-button" className="native-viewer__hidden-ar-button">Open AR</button>
        </model-viewer>
      ) : (
        <div className="native-viewer__loading">Loading model-viewer...</div>
      )}

    </div>
  );
}

function MarkerARMode({ onBack }) {
  const modelViewerRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(Boolean(customElements.get("model-viewer")));
  const [status, setStatus] = useState("Tap 'Open AR' to place the model on a wall.");
  const [arActive, setArActive] = useState(false);

  // Inject model-viewer script once.
  // Pin window.THREE to the app's Three.js instance BEFORE the script loads so
  // model-viewer reuses it instead of creating a second copy — this eliminates
  // the "Multiple instances of Three.js being imported" console warning.
  useEffect(() => {
    if (!window.THREE) window.THREE = THREE;
    if (customElements.get("model-viewer")) return;
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
    script.onload = () => setScriptReady(true);
    script.onerror = () => console.error("[marker-ar] Could not load model-viewer script");
    document.head.appendChild(script);
  }, []);

  // Sync with model-viewer ar-status events
  useEffect(() => {
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    function onArStatus(event) {
      const s = event.detail?.status;
      if (s === "session-started") {
        setArActive(true);
        setStatus("AR active — move your phone to scan the wall, then tap to place.");
      } else if (s === "object-placed") {
        setStatus("Model placed! Pinch to scale, drag to reposition.");
      } else if (s === "failed") {
        setArActive(false);
        setStatus("AR failed. Check camera permissions and try again.");
      } else if (s === "not-presenting") {
        setArActive(false);
        setStatus("Tap 'Open AR' to place the model on a wall.");
      }
    }

    viewer.addEventListener("ar-status", onArStatus);
    return () => viewer.removeEventListener("ar-status", onArStatus);
  }, [scriptReady]);

  return (
    <div className="native-viewer native-viewer--simulator">
      {/* Top bar */}
      <div className="ar-topbar" style={{ zIndex: 10 }}>
        <button onClick={onBack}>Back</button>
        <div>{status}</div>
      </div>

      {scriptReady ? (
        <model-viewer
          ar camera-controls
          ref={modelViewerRef}
          src={MODEL_URL}
          alt="A 3D model of some wall art"
          ar-modes="webxr scene-viewer quick-look"
          touch-action="pan-y"
          // shadow-intensity="1"
          // shadow-softness="0.5"
          // exposure="1.2"
          className="marker-viewer__host"
        >
          <button slot="ar-button" className="marker-viewer__ar-btn">
            📷 Open AR
          </button>
        </model-viewer>
      ) : (
        <div className="native-viewer__loading">Loading model-viewer…</div>
      )}
    </div>
  );
}

async function getModelViewerScale() {
  if (!modelViewerScalePromise) {
    modelViewerScalePromise = preloadModel().then(({ maxAxis }) => (NORMALIZED_MODEL_SIZE / maxAxis) * MODEL_SCALE);
  }
  return modelViewerScalePromise;
}

function preloadModel() {
  if (!modelAssetPromise) {
    modelAssetPromise = loadModelAsset();
  }
  return modelAssetPromise;
}

async function loadModelAsset() {
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
}

function formatVectorScale(scale) {
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : FALLBACK_MODEL_VIEWER_SCALE;
  const value = safeScale.toFixed(5);
  return `${value} ${value} ${value}`;
}

async function loadModel() {
  const asset = await preloadModel();
  const model = asset.scene.clone(true);
  cloneModelResources(model);
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

function cloneModelResources(model) {
  model.traverse((child) => {
    if (!child.isMesh) return;
    if (child.geometry) child.geometry = child.geometry.clone();
    if (Array.isArray(child.material)) {
      child.material = child.material.map((material) => material.clone());
    } else if (child.material) {
      child.material = child.material.clone();
    }
  });
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

function createSimulatorSurface() {
  const surface = new THREE.Group();

  const floorGeo = new THREE.PlaneGeometry(100, 100);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.9,
    metalness: 0.1,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  surface.add(floor);

  const grid = new THREE.GridHelper(100, 200, 0x888888, 0x333333);
  grid.position.y = 0.001;
  surface.add(grid);

  return surface;
}

function createWebXRShadowSurface() {
  const surface = new THREE.Group();
  const shadowGeo = new THREE.PlaneGeometry(3, 3);
  const shadowMat = new THREE.ShadowMaterial({
    color: 0x000000,
    opacity: 0.24,
    transparent: true,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.receiveShadow = true;
  surface.add(shadow);
  return surface;
}

function Desktop3DMode({ onBack }) {
  const canvasRef = useRef(null);
  const cleanupRef = useRef(null);
  const [status, setStatus] = useState("Tap a surface to place the dish.");
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
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
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
  
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  light.shadow.bias = -0.0005;
  light.shadow.radius = 1.5; // Slightly sharper, pronounced shadow edge to match reference
  scene.add(light);

  const surface = createSimulatorSurface();
  scene.add(surface);
  const floor = surface.children.find((child) => child.isMesh);

  const model = await loadModel();
  model.position.set(0, 0, -1);
  model.visible = false;
  scene.add(model);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  
  let isPlaced = false;

  function onPointerDown(event) {
    if (isPlaced) return; // lock position after first placement

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(floor);
    if (intersects.length > 0) {
      model.position.copy(intersects[0].point);
      model.position.y = 0;
      model.visible = true;
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

  // Attach to canvas so only taps on the 3-D viewport trigger placement.
  // Using canvas directly avoids the transparent-canvas hit-test issue where
  // the browser resolves event.target to the parent container instead of
  // the canvas, causing an event.target guard to bail out incorrectly.
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
  }
  window.addEventListener('resize', resize);

  function renderLoop() {
    renderer.render(scene, camera);
  }

  let isRendering = false;

  function resume() {
    if (isRendering) return;
    isRendering = true;
    renderer.setAnimationLoop(renderLoop);
  }

  function pause() {
    if (!isRendering) return;
    isRendering = false;
    renderer.setAnimationLoop(null);
  }

  resume();

  return {
    cleanup: () => {
      pause();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', resize);
      disposeWorld(scene);
      renderer.dispose();
    },
    reset: () => {
      isPlaced = false;
      model.position.set(0, 0, -1);
      model.visible = false;
      setStatus("Tap a surface to place the dish.");
      setPlaced(false);
    },
    pause,
    resume,
  };
}
