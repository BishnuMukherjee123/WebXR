import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const MODEL_URL = "/models/10.glb";
const MODEL_SCALE = 0.8;

export default function ThreeARScene() {
  const [mode, setMode] = useState("home");

  return (
    <div className="ar-app">
      {mode === "home" && <HomeScreen onMode={setMode} />}
      {mode === "webxr" && <WebXRSurfaceMode onBack={() => setMode("home")} />}
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
      <p>Choose a free AR mode. Surface AR stays in browser on Android Chrome; native AR works wider but opens the phone viewer.</p>

      <div className="ar-mode-list">
        <button className="ar-mode-card is-primary" onClick={() => onMode("webxr")}>
          <span>Browser Surface AR</span>
          <small>Free WebXR hit-test. Best on Android Chrome.</small>
        </button>
        <button className="ar-mode-card" onClick={() => onMode("native")}>
          <span>Native Surface AR</span>
          <small>Uses model-viewer. May open Scene Viewer or Quick Look.</small>
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
      cleanupRef.current?.();
    };
  }, []);

  async function startWebXR() {
    if (!supported || starting) return;
    setStarting(true);
    setStatus("Starting WebXR...");

    try {
      const cleanup = await initWebXR(canvasRef.current, setStatus, modelRef, reticleRef);
      cleanupRef.current = cleanup;
      setStatus("Move slowly. Tap the floor when the ring appears.");
      console.log("[WebXR] Surface mode started");
    } catch (err) {
      console.error("[WebXR] Start failed", err);
      setStatus(err?.message || "Could not start WebXR AR.");
      setStarting(false);
    }
  }

  function resetPlacement() {
    if (modelRef.current) modelRef.current.visible = false;
    setStatus("Move slowly. Tap the floor when the ring appears.");
  }

  return (
    <div className="ar-stage">
      <canvas ref={canvasRef} className="ar-stage__canvas" />
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
        {starting && <button onClick={resetPlacement}>Reset</button>}
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();

  scene.add(new THREE.HemisphereLight(0xffffff, 0x808080, 1.2));
  const light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(1.4, 3, 1.6);
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

  function placeModel() {
    if (!reticle.visible) {
      setStatus("No floor hit yet. Move slowly and aim at a textured surface.");
      return;
    }
    model.position.setFromMatrixPosition(reticle.matrix);
    model.quaternion.setFromRotationMatrix(reticle.matrix);
    model.visible = true;
    setStatus("Placed. Move your phone around the dish.");
    console.log("[WebXR] Model placed on hit-test surface");
  }

  session.addEventListener("select", placeModel);
  window.addEventListener("resize", resize);

  renderer.setAnimationLoop((_, frame) => {
    if (frame) {
      const hits = frame.getHitTestResults(hitTestSource);
      if (hits.length > 0) {
        const pose = hits[0].getPose(referenceSpace);
        reticle.visible = true;
        reticle.matrix.fromArray(pose.transform.matrix);
      } else {
        reticle.visible = false;
      }
    }
    renderer.render(scene, camera);
  });

  return () => {
    renderer.setAnimationLoop(null);
    window.removeEventListener("resize", resize);
    session.removeEventListener("select", placeModel);
    hitTestSource.cancel?.();
    if (session.end) session.end().catch(() => {});
    disposeWorld(scene);
    renderer.dispose();
    modelRef.current = null;
    reticleRef.current = null;
  };
}

function NativeModelViewerMode({ onBack }) {
  const [scriptReady, setScriptReady] = useState(Boolean(customElements.get("model-viewer")));

  useEffect(() => {
    if (customElements.get("model-viewer")) {
      return undefined;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
    script.onload = () => setScriptReady(true);
    script.onerror = () => console.error("[model-viewer] Could not load model-viewer script");
    document.head.appendChild(script);
    return () => {};
  }, []);

  return (
    <div className="native-viewer">
      <div className="ar-topbar">
        <button onClick={onBack}>Back</button>
        <div>Native Surface AR</div>
      </div>
      {scriptReady ? (
        <model-viewer
          src={MODEL_URL}
          alt="Bong Kebab"
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-placement="floor"
          ar-scale="auto"
          quick-look-browsers="safari chrome"
          camera-controls
          auto-rotate
          shadow-intensity="1"
          exposure="1"
          className="native-viewer__model"
        >
          <button slot="ar-button" className="native-viewer__ar-button">
            View in AR
          </button>
        </model-viewer>
      ) : (
        <div className="native-viewer__loading">Loading native AR viewer...</div>
      )}
      <div className="native-viewer__note">
        Android opens Scene Viewer. iPhone AR needs a USDZ file for best Quick Look support.
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
  model.scale.setScalar(MODEL_SCALE);
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
  model.scale.setScalar(1.25 / maxAxis);
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
