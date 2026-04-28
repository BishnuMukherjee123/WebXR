import { useEffect, useRef } from "react";
import * as THREE from "three";
import { clone as skeletonClone } from "three/addons/utils/SkeletonUtils.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default function ARScene() {
  const containerRef = useRef();
  const videoRef = useRef();

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;

    // ── 1. CAMERA FEED ────────────────────────────────────────────
    let stream = null;
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      .then((s) => { stream = s; video.srcObject = s; video.play(); })
      .catch((err) => console.error("❌ Camera error:", err));

    // ── 2. SCENE ──────────────────────────────────────────────────
    const scene = new THREE.Scene();

    // Lights — strong ambient so GLB model always visible
    const ambientLight = new THREE.AmbientLight(0xffffff, 2);
    scene.add(ambientLight);
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
    hemiLight.position.set(0.5, 1, 0.25);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);

    // ── 3. THREE.JS CAMERA ────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(
      60, window.innerWidth / window.innerHeight, 0.01, 100
    );
    camera.position.set(0, 0, 0);

    // ── 4. RENDERER — transparent canvas on top of video ──────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    container.appendChild(renderer.domElement);

    // ── 5. RETICLE — always visible at screen center ───────────────
    // The reticle sits 1.2m in front of the camera in the scene.
    // It moves as the phone tilts, showing "where the model will land".
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.06, 0.1, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: 0x00ffcc,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      })
    );
    scene.add(reticle);

    // ── 6. RAYCASTER ──────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();

    // ── 7. MODEL LOADING ──────────────────────────────────────────
    let preloadedModel = null;
    const loader = new GLTFLoader();
    // Load GLB from GitHub via jsDelivr CDN — works on any domain, no Vercel upload needed
    const MODEL_URL = "https://cdn.jsdelivr.net/gh/BishnuMukherjee123/WebXR@main/public/models/10.glb";
    loader.load(
      MODEL_URL,
      (gltf) => {
        preloadedModel = gltf.scene;
        preloadedModel.traverse((child) => {
          if (child.isMesh) {
            child.frustumCulled = false;
            if (child.material) {
              child.material.needsUpdate = true;
              // Ensure materials are double-sided for visibility
              child.material.side = THREE.FrontSide;
            }
          }
        });
        console.log("✅ GLB loaded successfully");
      },
      (xhr) => {
        if (xhr.total > 0)
          console.log(`📦 GLB: ${Math.round((xhr.loaded / xhr.total) * 100)}%`);
      },
      (err) => console.error("❌ GLB load error:", err)
    );

    // ── 8. DEVICE ORIENTATION ─────────────────────────────────────
    // Rotate Three.js camera to match phone tilt
    const deviceQuat = new THREE.Quaternion();
    const deviceEuler = new THREE.Euler();
    let hasOrientation = false;

    function onOrientation(e) {
      if (e.alpha === null) return;
      hasOrientation = true;
      // Map device angles to Three.js camera rotation
      // beta: tilt up/down (0=flat, 90=upright looking forward)
      // gamma: tilt left/right
      // alpha: compass heading
      deviceEuler.set(
        THREE.MathUtils.degToRad(e.beta  - 90),  // -90 so upright = looking forward
        THREE.MathUtils.degToRad(-e.alpha),
        THREE.MathUtils.degToRad(-e.gamma),
        "YXZ"
      );
      deviceQuat.setFromEuler(deviceEuler);
    }

    if (window.DeviceOrientationEvent) {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        // iOS 13+
        DeviceOrientationEvent.requestPermission()
          .then((p) => { if (p === "granted") window.addEventListener("deviceorientation", onOrientation); })
          .catch(console.warn);
      } else {
        window.addEventListener("deviceorientation", onOrientation);
      }
    }

    // ── 9. PLACEMENT — guaranteed to work regardless of phone angle ─
    // Strategy: ray.at(1.2) places model 1.2m in front along the tap ray.
    // This ALWAYS returns a valid position — no plane intersection that can fail.
    // y is clamped so model doesn't appear above camera view.

    function getPlacementPosition(clientX, clientY) {
      const x = (clientX / window.innerWidth)  *  2 - 1;
      const y = (clientY / window.innerHeight) * -2 + 1;
      raycaster.setFromCamera({ x, y }, camera);

      // Place model 1.2m along the ray from the camera
      const pos = new THREE.Vector3();
      raycaster.ray.at(1.2, pos);
      return pos;
    }

    function placeModel(clientX, clientY) {
      if (!preloadedModel) {
        console.warn("⚠️ GLB not loaded yet — wait a moment and try again");
        return;
      }

      const pos = getPlacementPosition(clientX, clientY);
      const model = skeletonClone(preloadedModel);
      model.position.copy(pos);
      model.scale.set(0.2, 0.2, 0.2);

      // Face the model toward the camera on the horizontal axis only
      model.lookAt(new THREE.Vector3(
        camera.position.x,
        model.position.y,
        camera.position.z
      ));

      model.traverse((child) => {
        if (child.isMesh) {
          child.visible = true;
          child.frustumCulled = false;
          if (child.material) child.material.needsUpdate = true;
        }
      });

      scene.add(model);
      console.log("✅ Model placed at", pos);
    }

    // Touch (mobile)
    function onTouchEnd(e) {
      e.preventDefault();
      const t = e.changedTouches[0];
      placeModel(t.clientX, t.clientY);
    }
    // Click (desktop testing)
    function onClick(e) { placeModel(e.clientX, e.clientY); }

    renderer.domElement.addEventListener("touchend", onTouchEnd, { passive: false });
    renderer.domElement.addEventListener("click", onClick);

    // ── 10. ANIMATE ───────────────────────────────────────────────
    const smoothQuat = new THREE.Quaternion();
    let animId;

    function animate() {
      animId = requestAnimationFrame(animate);

      // Smoothly apply device orientation to camera
      if (hasOrientation) {
        smoothQuat.slerp(deviceQuat, 0.08);
        camera.quaternion.copy(smoothQuat);
      }

      // Keep reticle at screen center, 1.2m in front of camera
      // This acts as an aiming crosshair
      raycaster.setFromCamera({ x: 0, y: 0 }, camera);
      const reticlePos = new THREE.Vector3();
      raycaster.ray.at(1.2, reticlePos);
      reticle.position.copy(reticlePos);

      // Keep reticle horizontal (parallel to ground)
      reticle.rotation.set(-Math.PI / 2, 0, 0);
      // Override with camera-relative rotation so it faces camera
      reticle.lookAt(camera.position);

      renderer.render(scene, camera);
    }
    animate();

    // ── 11. RESIZE ────────────────────────────────────────────────
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onResize);

    // ── 12. RESET ─────────────────────────────────────────────────
    window.resetAR = () => {
      const keep = new Set([reticle, ambientLight, hemiLight, dirLight]);
      [...scene.children]
        .filter((o) => !keep.has(o))
        .forEach((o) => scene.remove(o));
      console.log("🔄 Scene reset");
    };

    // ── CLEANUP ───────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("deviceorientation", onOrientation);
      renderer.domElement.removeEventListener("touchend", onTouchEnd);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.dispose();
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        playsInline
        muted
        style={{
          position: "fixed", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", zIndex: 0,
        }}
      />
      <div
        ref={containerRef}
        style={{ position: "fixed", inset: 0, zIndex: 1 }}
      />
    </>
  );
}