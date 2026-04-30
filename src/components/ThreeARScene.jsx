import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const MODEL_URL = "/models/10.glb";
const MODEL_BASE_SCALE = 0.8;
const PLACEMENT_DEPTH = -2.05;

export default function ThreeARScene() {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cleanupRef = useRef(null);
  const anchorRef = useRef(null);
  const cameraRef = useRef(null);
  const orientationRef = useRef({ current: null, baseline: null, available: false });
  const pointersRef = useRef(new Map());
  const gestureRef = useRef({ x: 0, y: 0, distance: 0, scale: 1, placed: false });
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [status, setStatus] = useState("Camera AR viewer");
  const [error, setError] = useState("");

  async function startAR() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera API is not available in this browser.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      const video = videoRef.current;
      video.srcObject = stream;
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      await video.play();
      const stopOrientation = await startOrientationTracking();

      const cleanup = await initThree(stream, stopOrientation);
      cleanupRef.current = cleanup;
      setStarted(true);
      setStatus("Tap the table/floor area to place the dish.");
      console.log("[ThreeAR] Browser camera viewer started", `${video.videoWidth}x${video.videoHeight}`);
    } catch (err) {
      console.error("[ThreeAR] Start failed", err);
      setError(err?.message || "Could not start camera.");
    } finally {
      setLoading(false);
    }
  }

  async function initThree(stream, stopOrientation) {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.01, 100);
    camera.position.set(0, 0.95, 2.45);
    camera.lookAt(0, 0.15, PLACEMENT_DEPTH);
    cameraRef.current = camera;

    const anchor = new THREE.Group();
    anchor.visible = false;
    anchor.position.set(0, 0, PLACEMENT_DEPTH);
    scene.add(anchor);
    anchorRef.current = anchor;

    const ambient = new THREE.HemisphereLight(0xffffff, 0x808080, 1.1);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(1.4, 3.2, 1.6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far = 8;
    key.shadow.camera.left = -3;
    key.shadow.camera.right = 3;
    key.shadow.camera.top = 3;
    key.shadow.camera.bottom = -3;
    key.shadow.bias = -0.0007;
    scene.add(key);
    key.target = anchor;

    const fill = new THREE.DirectionalLight(0xffffff, 0.8);
    fill.position.set(-2, 1, 1);
    scene.add(fill);

    const shadowCatcher = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 5),
      new THREE.ShadowMaterial({ opacity: 0.5 }),
    );
    shadowCatcher.rotation.x = -Math.PI / 2;
    shadowCatcher.position.y = 0;
    shadowCatcher.receiveShadow = true;
    anchor.add(shadowCatcher);

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
    dracoLoader.setDecoderConfig({ type: "wasm" });

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    const gltf = await loader.loadAsync(MODEL_URL);
    const model = gltf.scene;
    normalizeModel(model);
    model.position.set(0, 0, 0);
    model.scale.setScalar(MODEL_BASE_SCALE);
    model.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = false;
      if (child.material) child.material.needsUpdate = true;
    });
    anchor.add(model);

    function resize() {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    let rafId = 0;
    function render() {
      rafId = requestAnimationFrame(render);
      updateCameraForPlacedAnchor(camera);
      renderer.render(scene, camera);
    }

    resize();
    window.addEventListener("resize", resize);
    render();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      stopOrientation?.();
      stream.getTracks().forEach((track) => track.stop());
      disposeWorld(scene);
      dracoLoader.dispose();
      renderer.dispose();
      anchorRef.current = null;
      cameraRef.current = null;
    };
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

  function placeAtScreenPoint(clientX, clientY) {
    const anchor = anchorRef.current;
    const camera = cameraRef.current;
    const canvas = canvasRef.current;
    if (!anchor || !camera || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -(((clientY - rect.top) / rect.height) * 2 - 1),
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(ndc, camera);

    const placementPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    const hasHit = raycaster.ray.intersectPlane(placementPlane, hit);

    if (hasHit) {
      anchor.position.copy(hit);
      anchor.position.y = 0;
    } else {
      anchor.position.set(ndc.x * 1.1, 0, PLACEMENT_DEPTH);
    }

    anchor.visible = true;
    orientationRef.current.baseline = orientationRef.current.current
      ? { ...orientationRef.current.current }
      : null;
    setPlaced(true);
    setStatus(
      orientationRef.current.available
        ? "Placed. Move your phone to view, drag to rotate, pinch to resize."
        : "Placed. Drag to rotate, pinch to resize.",
    );
  }

  async function startOrientationTracking() {
    if (!window.DeviceOrientationEvent) {
      console.warn("[ThreeAR] Device orientation is not available");
      return null;
    }

    try {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== "granted") {
          console.warn("[ThreeAR] Device orientation permission was not granted");
          return null;
        }
      }
    } catch (err) {
      console.warn("[ThreeAR] Device orientation permission failed", err);
      return null;
    }

    const onOrientation = (event) => {
      if (
        typeof event.alpha !== "number" ||
        typeof event.beta !== "number" ||
        typeof event.gamma !== "number"
      ) {
        return;
      }

      orientationRef.current.current = {
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
      };
      orientationRef.current.available = true;
    };

    window.addEventListener("deviceorientation", onOrientation, true);
    return () => window.removeEventListener("deviceorientation", onOrientation, true);
  }

  function updateCameraForPlacedAnchor(camera) {
    const anchor = anchorRef.current;
    const orientation = orientationRef.current;
    if (!anchor?.visible || !orientation.current || !orientation.baseline) {
      camera.position.lerp(new THREE.Vector3(0, 0.95, 2.45), 0.08);
      camera.lookAt(0, 0.15, PLACEMENT_DEPTH);
      return;
    }

    const yaw = THREE.MathUtils.degToRad(
      shortestAngle(orientation.current.alpha, orientation.baseline.alpha),
    );
    const pitch = THREE.MathUtils.degToRad(
      THREE.MathUtils.clamp(orientation.current.beta - orientation.baseline.beta, -35, 35),
    );
    const roll = THREE.MathUtils.degToRad(
      THREE.MathUtils.clamp(orientation.current.gamma - orientation.baseline.gamma, -28, 28),
    );

    const radius = 2.45;
    const target = new THREE.Vector3(
      anchor.position.x,
      anchor.position.y + 0.28 * anchor.scale.y,
      anchor.position.z,
    );
    const desired = new THREE.Vector3(
      target.x + Math.sin(-yaw) * radius + Math.sin(roll) * 0.28,
      THREE.MathUtils.clamp(0.95 - Math.sin(pitch) * 1.15, 0.35, 1.75),
      target.z + Math.cos(-yaw) * radius,
    );

    camera.position.lerp(desired, 0.12);
    camera.lookAt(target);
  }

  function resetModel() {
    const anchor = anchorRef.current;
    if (!anchor) return;
    anchor.visible = false;
    anchor.rotation.set(0, 0, 0);
    anchor.scale.setScalar(1);
    anchor.position.set(0, 0, PLACEMENT_DEPTH);
    setPlaced(false);
    setStatus("Tap the table/floor area to place the dish.");
  }

  function onPointerDown(event) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointersRef.current.values()];
    gestureRef.current = {
      x: event.clientX,
      y: event.clientY,
      distance: points.length >= 2 ? distance(points[0], points[1]) : 0,
      scale: anchorRef.current?.scale.x || 1,
      placed,
    };
  }

  function onPointerMove(event) {
    const anchor = anchorRef.current;
    if (!anchor || !pointersRef.current.has(event.pointerId) || !placed) return;

    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointersRef.current.values()];

    if (points.length >= 2) {
      const nextDistance = distance(points[0], points[1]);
      const startDistance = gestureRef.current.distance || nextDistance;
      const nextScale = THREE.MathUtils.clamp(
        gestureRef.current.scale * (nextDistance / startDistance),
        0.45,
        1.8,
      );
      anchor.scale.setScalar(nextScale);
      return;
    }

    const dx = event.clientX - gestureRef.current.x;
    anchor.rotation.y += dx * 0.01;
    gestureRef.current.x = event.clientX;
    gestureRef.current.y = event.clientY;
  }

  function onPointerUp(event) {
    const pointer = pointersRef.current.get(event.pointerId);
    pointersRef.current.delete(event.pointerId);

    if (!pointer || gestureRef.current.placed || pointersRef.current.size > 0) return;

    const move = Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y);
    if (move < 8) placeAtScreenPoint(event.clientX, event.clientY);
  }

  useEffect(() => {
    return () => cleanupRef.current?.();
  }, []);

  return (
    <div ref={containerRef} className="three-ar">
      <video ref={videoRef} className="three-ar__video" />
      <canvas
        ref={canvasRef}
        className="three-ar__canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      <div className="three-ar__hud">
        <div className="three-ar__pill">{started ? status : "Camera AR viewer"}</div>
      </div>

      {!started && (
        <div className="three-ar__landing">
          <div className="three-ar__badge">AR</div>
          <h1>Aroma AR</h1>
          <p>Open the camera, then tap the table or floor area to place the dish.</p>
          <button onClick={startAR} disabled={loading}>
            {loading ? "Starting..." : "Launch AR"}
          </button>
          {error && <div className="three-ar__error">{error}</div>}
        </div>
      )}

      {started && (
        <div className="three-ar__actions">
          <button onClick={resetModel}>Reset</button>
        </div>
      )}
    </div>
  );
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

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function shortestAngle(current, base) {
  let delta = current - base;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return delta;
}
