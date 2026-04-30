import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import * as ZapparThree from "@zappar/zappar-threejs";
import { CustomAnchor, TransformOrientation } from "@zappar/zappar";
import { PlanesMeshes } from "@zappar/zappar-threejs/lib/mesh/planesmeshes.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const MODEL_BASE_SCALE = 0.8;
const MODEL_URL = "/models/10.glb";

const DISHES = [{ id: "dish-1", name: "Bong Kebab", url: MODEL_URL }];

export default function ThreeARScene() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const cleanupRef = useRef(null);
  const cameraRef = useRef(null);
  const worldTrackerRef = useRef(null);
  const planesRef = useRef(null);
  const customAnchorRef = useRef(null);
  const anchorGroupRef = useRef(null);
  const contentRef = useRef(null);
  const loaderRef = useRef(null);
  const dracoLoaderRef = useRef(null);
  const currentModelRef = useRef(null);
  const pointersRef = useRef(new Map());
  const gestureRef = useRef({ x: 0, y: 0, distance: 0, scale: 1, placed: false });
  const placedRef = useRef(false);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [placed, setPlaced] = useState(false);
  const [status, setStatus] = useState("Zappar world tracking");
  const [error, setError] = useState("");

  async function startAR() {
    setError("");
    setLoading(true);

    try {
      if (ZapparThree.browserIncompatible()) {
        throw new Error("This browser does not support Zappar world tracking. Open this link in Safari or Chrome on your phone.");
      }

      ZapparThree.setPreferWebXRCamera(false);
      const granted = await ZapparThree.permissionRequest();
      if (!granted) {
        throw new Error("Camera or motion permission was denied.");
      }

      const cleanup = await initZapparWorldTracking();
      cleanupRef.current = cleanup;
      setStarted(true);
      setStatus("Move slowly until surfaces appear, then tap the floor/table.");
      console.log("[ZapparAR] World tracking started");
    } catch (err) {
      console.error("[ZapparAR] Start failed", err);
      setError(err?.message || "Could not start Zappar AR.");
    } finally {
      setLoading(false);
    }
  }

  async function initZapparWorldTracking() {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    ZapparThree.glContextSet(renderer.getContext());

    const scene = new THREE.Scene();
    const camera = new ZapparThree.Camera({ zNear: 0.01, zFar: 100 });
    camera.profile = ZapparThree.CameraProfile.High;
    scene.background = camera.backgroundTexture;
    cameraRef.current = camera;

    const worldTracker = new ZapparThree.WorldTracker();
    worldTracker.horizontalPlaneDetectionEnabled = true;
    worldTracker.verticalPlaneDetectionEnabled = false;
    worldTrackerRef.current = worldTracker;
    const trackingUI = new ZapparThree.WorldTrackerUI(canvas);
    trackingUI.setText("Move your phone slowly left and right");

    const customAnchor = new CustomAnchor(worldTracker);
    customAnchorRef.current = customAnchor;

    const anchorGroup = new THREE.Group();
    anchorGroup.matrixAutoUpdate = false;
    anchorGroup.visible = false;
    scene.add(anchorGroup);
    anchorGroupRef.current = anchorGroup;

    const content = new THREE.Group();
    anchorGroup.add(content);
    contentRef.current = content;

    const planes = new PlanesMeshes(camera, worldTracker, {
      color: 0xffffff,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    planes.visible = true;
    scene.add(planes);
    planesRef.current = planes;

    const ambient = new THREE.HemisphereLight(0xffffff, 0x808080, 1.15);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(1.5, 3.2, 1.5);
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
    key.target = content;

    const fill = new THREE.DirectionalLight(0xffffff, 0.6);
    fill.position.set(-2, 1.2, 1);
    scene.add(fill);

    const shadowCatcher = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 5),
      new THREE.ShadowMaterial({ opacity: 0.42 }),
    );
    shadowCatcher.rotation.x = -Math.PI / 2;
    shadowCatcher.receiveShadow = true;
    content.add(shadowCatcher);

    dracoLoaderRef.current = new DRACOLoader();
    dracoLoaderRef.current.setDecoderPath("/draco/gltf/");
    dracoLoaderRef.current.setDecoderConfig({ type: "wasm" });

    loaderRef.current = new GLTFLoader();
    loaderRef.current.setDRACOLoader(dracoLoaderRef.current);
    await loadDish(DISHES[0]);

    function resize() {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
    }

    let rafId = 0;
    function render() {
      rafId = requestAnimationFrame(render);
      camera.updateFrame(renderer);
      updateTrackingUI(trackingUI, worldTracker);
      updatePlacedAnchor(camera);
      renderer.render(scene, camera);
    }

    resize();
    window.addEventListener("resize", resize);
    camera.start(false);
    render();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      camera.stop();
      camera.dispose();
      trackingUI.hide();
      trackingUI.dom?.remove();
      customAnchor.destroy();
      worldTracker.destroy();
      disposeWorld(scene);
      dracoLoaderRef.current?.dispose();
      renderer.dispose();
      cameraRef.current = null;
      worldTrackerRef.current = null;
      planesRef.current = null;
      customAnchorRef.current = null;
      anchorGroupRef.current = null;
      contentRef.current = null;
      loaderRef.current = null;
      dracoLoaderRef.current = null;
      currentModelRef.current = null;
      placedRef.current = false;
    };
  }

  function updateTrackingUI(trackingUI, worldTracker) {
    if (placedRef.current) {
      trackingUI.hide();
      return;
    }

    const hasTrackedPlane = [...worldTracker.planes.values()].some(
      (plane) => plane.status === ZapparThree.AnchorStatus.ANCHOR_STATUS_TRACKING,
    );

    if (hasTrackedPlane || worldTracker.groundAnchor.status !== ZapparThree.AnchorStatus.ANCHOR_STATUS_STOPPED) {
      trackingUI.hide();
      return;
    }

    trackingUI.show();
    trackingUI.update();
  }

  async function loadDish(dish) {
    const content = contentRef.current;
    const loader = loaderRef.current;
    if (!content || !loader) return;

    setStatus(`Loading ${dish.name}...`);

    try {
      if (currentModelRef.current) {
        content.remove(currentModelRef.current);
        disposeObject(currentModelRef.current);
        currentModelRef.current = null;
      }

      const gltf = await loader.loadAsync(dish.url);
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
      content.add(model);
      currentModelRef.current = model;
      setStatus("Move slowly until surfaces appear, then tap the floor/table.");
    } catch (err) {
      console.error("[ZapparAR] Dish load failed", err);
      setStatus(`Could not load ${dish.name}.`);
    }
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

  function updatePlacedAnchor(camera) {
    const anchorGroup = anchorGroupRef.current;
    const customAnchor = customAnchorRef.current;
    if (!anchorGroup || !customAnchor || !placedRef.current) return;

    anchorGroup.matrix.fromArray(
      customAnchor.pose(camera.rawPose, camera.currentMirrorMode === ZapparThree.CameraMirrorMode.Poses),
    );
    anchorGroup.matrix.decompose(anchorGroup.position, anchorGroup.quaternion, anchorGroup.scale);
    anchorGroup.visible = customAnchor.status === ZapparThree.AnchorStatus.ANCHOR_STATUS_TRACKING;
  }

  function placeAtScreenPoint(clientX, clientY) {
    const canvas = canvasRef.current;
    const camera = cameraRef.current;
    const planes = planesRef.current;
    const worldTracker = worldTrackerRef.current;
    const customAnchor = customAnchorRef.current;
    const anchorGroup = anchorGroupRef.current;
    if (!canvas || !camera || !planes || !worldTracker || !customAnchor || !anchorGroup) return;

    const rect = canvas.getBoundingClientRect();
    const pointer = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -(((clientY - rect.top) / rect.height) * 2 - 1),
    );

    camera.updateMatrixWorld();
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(pointer, camera);

    const planeHit = planes.intersect(raycaster)[0];
    if (planeHit) {
      const local = planeHit.intersection.point.clone();
      planeHit.intersection.object.worldToLocal(local);
      customAnchor.setPoseFromAnchorOffset(
        planeHit.anchorId,
        local.x,
        local.y,
        local.z,
        TransformOrientation.Z_TOWARDS_CAMERA,
      );
      finishPlacement();
      return;
    }

    if (worldTracker.groundAnchor.status !== ZapparThree.AnchorStatus.ANCHOR_STATUS_STOPPED) {
      const groundMatrix = new THREE.Matrix4().fromArray(
        worldTracker.groundAnchor.pose(camera.rawPose, camera.currentMirrorMode === ZapparThree.CameraMirrorMode.Poses),
      );
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0).applyMatrix4(groundMatrix);
      const point = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(groundPlane, point)) {
        const local = point.clone().applyMatrix4(groundMatrix.clone().invert());
        customAnchor.setPoseFromAnchorOffset(
          worldTracker.groundAnchor,
          local.x,
          local.y,
          local.z,
          TransformOrientation.Z_TOWARDS_CAMERA,
        );
        finishPlacement();
        return;
      }
    }

    setStatus("No tracked surface at that tap yet. Move slowly and tap the visible floor/table mesh.");
  }

  function finishPlacement() {
    placedRef.current = true;
    anchorGroupRef.current.visible = true;
    planesRef.current.visible = false;
    setPlaced(true);
    setStatus("Placed on tracked surface. Move your phone around it; drag to rotate, pinch to resize.");
    console.log("[ZapparAR] Model anchored to tracked surface");
  }

  function resetModel() {
    const anchorGroup = anchorGroupRef.current;
    const content = contentRef.current;
    const planes = planesRef.current;
    if (!anchorGroup || !content || !planes) return;
    placedRef.current = false;
    anchorGroup.visible = false;
    content.rotation.set(0, 0, 0);
    content.scale.setScalar(1);
    planes.visible = true;
    setPlaced(false);
    setStatus("Move slowly until surfaces appear, then tap the floor/table.");
  }

  function onPointerDown(event) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointersRef.current.values()];
    gestureRef.current = {
      x: event.clientX,
      y: event.clientY,
      distance: points.length >= 2 ? distance(points[0], points[1]) : 0,
      scale: contentRef.current?.scale.x || 1,
      placed: placedRef.current,
    };
  }

  function onPointerMove(event) {
    const content = contentRef.current;
    if (!content || !pointersRef.current.has(event.pointerId) || !placedRef.current) return;

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
      content.scale.setScalar(nextScale);
      return;
    }

    const dx = event.clientX - gestureRef.current.x;
    content.rotation.y += dx * 0.01;
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
      <canvas
        ref={canvasRef}
        className="three-ar__canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      <div className="three-ar__hud">
        <div className="three-ar__pill">{started ? status : "Zappar world tracking"}</div>
      </div>

      {!started && (
        <div className="three-ar__landing">
          <div className="three-ar__badge">AR</div>
          <h1>Aroma AR</h1>
          <p>Open the browser camera, scan the floor, then tap the tracked surface to place the dish.</p>
          <button onClick={startAR} disabled={loading}>
            {loading ? "Starting..." : "Launch AR"}
          </button>
          {error && <div className="three-ar__error">{error}</div>}
        </div>
      )}

      {started && (
        <div className="three-ar__actions">
          <button onClick={resetModel} disabled={!placed}>
            Reset
          </button>
        </div>
      )}
    </div>
  );
}

function disposeWorld(scene) {
  scene.traverse((obj) => {
    disposeObject(obj);
  });
}

function disposeObject(obj) {
  if (obj.geometry) obj.geometry.dispose();
  if (obj.material) {
    const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
    materials.forEach((mat) => mat.dispose());
  }
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
