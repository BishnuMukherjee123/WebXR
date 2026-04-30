import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const MODEL_URL = "/models/10.glb";

export default function ThreeARScene() {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cleanupRef = useRef(null);
  const modelRef = useRef(null);
  const pointersRef = useRef(new Map());
  const gestureRef = useRef({ x: 0, y: 0, distance: 0, scale: 1 });
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Point your camera at a clear surface.");
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
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("webkit-playsinline", "");
      await video.play();

      const cleanup = await initThree(stream);
      cleanupRef.current = cleanup;
      setStarted(true);
      setStatus("Drag to rotate. Pinch to resize.");
      console.log("[ThreeAR] Camera and renderer started", `${video.videoWidth}x${video.videoHeight}`);
    } catch (err) {
      console.error("[ThreeAR] Start failed", err);
      setError(err?.message || "Could not start camera.");
    } finally {
      setLoading(false);
    }
  }

  async function initThree(stream) {
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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.01, 100);
    camera.position.set(0, 0.35, 2.4);

    const ambient = new THREE.HemisphereLight(0xffffff, 0x808080, 1.5);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(1.5, 3, 2);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xffffff, 0.8);
    fill.position.set(-2, 1, 1);
    scene.add(fill);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.65, 64),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, -0.72, -1.8);
    scene.add(shadow);

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
    dracoLoader.setDecoderConfig({ type: "wasm" });

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    const gltf = await loader.loadAsync(MODEL_URL);
    const model = gltf.scene;
    normalizeModel(model);
    model.position.set(0, -0.68, -1.8);
    model.scale.setScalar(0.8);
    scene.add(model);
    modelRef.current = model;

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
      if (modelRef.current) modelRef.current.rotation.y += 0.002;
      renderer.render(scene, camera);
    }

    resize();
    window.addEventListener("resize", resize);
    render();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      stream.getTracks().forEach((track) => track.stop());
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          materials.forEach((mat) => mat.dispose());
        }
      });
      dracoLoader.dispose();
      renderer.dispose();
    };
  }

  function normalizeModel(model) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxAxis = Math.max(size.x, size.y, size.z) || 1;
    model.position.sub(center);
    model.scale.setScalar(1.25 / maxAxis);
  }

  function resetModel() {
    const model = modelRef.current;
    if (!model) return;
    model.rotation.set(0, 0, 0);
    model.scale.setScalar(0.8);
    model.position.set(0, -0.68, -1.8);
  }

  function onPointerDown(event) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointersRef.current.values()];
    gestureRef.current = {
      x: event.clientX,
      y: event.clientY,
      distance: points.length >= 2 ? distance(points[0], points[1]) : 0,
      scale: modelRef.current?.scale.x || 0.8,
    };
  }

  function onPointerMove(event) {
    const model = modelRef.current;
    if (!model || !pointersRef.current.has(event.pointerId)) return;

    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointersRef.current.values()];

    if (points.length >= 2) {
      const nextDistance = distance(points[0], points[1]);
      const startDistance = gestureRef.current.distance || nextDistance;
      const nextScale = THREE.MathUtils.clamp(
        gestureRef.current.scale * (nextDistance / startDistance),
        0.35,
        1.6,
      );
      model.scale.setScalar(nextScale);
      return;
    }

    const dx = event.clientX - gestureRef.current.x;
    const dy = event.clientY - gestureRef.current.y;
    model.rotation.y += dx * 0.01;
    model.position.y = THREE.MathUtils.clamp(model.position.y - dy * 0.002, -1.15, 0.15);
    gestureRef.current.x = event.clientX;
    gestureRef.current.y = event.clientY;
  }

  function onPointerUp(event) {
    pointersRef.current.delete(event.pointerId);
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
          <p>Open the camera and place the 3D model in your view.</p>
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

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
