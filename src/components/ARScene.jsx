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

    // ── 1. CAMERA FEED via getUserMedia (stays inside browser) ────
    let stream = null;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } })
      .then((s) => {
        stream = s;
        video.srcObject = s;
        video.play();
      })
      .catch((err) => console.error("❌ Camera error:", err));

    // ── 2. THREE.JS SCENE ─────────────────────────────────────────
    const scene = new THREE.Scene();

    // Lights
    scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3));
    const dir = new THREE.DirectionalLight(0xffffff, 2);
    dir.position.set(1, 3, 2);
    scene.add(dir);

    // ── 3. CAMERA (Three.js) ──────────────────────────────────────
    // Positioned at eye-height (1.5m), looking slightly down toward table
    const camera = new THREE.PerspectiveCamera(
      60, window.innerWidth / window.innerHeight, 0.01, 100
    );
    camera.position.set(0, 1.5, 0);
    camera.lookAt(0, 0, -2);

    // ── 4. RENDERER — transparent canvas ON TOP of video ──────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // fully transparent — video shows through
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    container.appendChild(renderer.domElement);

    // ── 5. VIRTUAL GROUND PLANE (simulates table/floor surface) ───
    // A flat invisible plane at y=0 is our "surface"
    // Ray from tap point → intersects this plane → model placed there
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const raycaster = new THREE.Raycaster();
    const planeIntersect = new THREE.Vector3();

    // ── 6. RETICLE (follows finger position on ground plane) ──────
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.12, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x00ffcc, side: THREE.DoubleSide, opacity: 0.8, transparent: true })
    );
    reticle.visible = false;
    scene.add(reticle);

    // ── 7. GLB PRELOAD ─────────────────────────────────────────────
    let preloadedModel = null;
    new GLTFLoader().load(
      "/models/10.glb",
      (gltf) => {
        preloadedModel = gltf.scene;
        preloadedModel.traverse((child) => {
          if (child.isMesh) {
            child.frustumCulled = false;
            if (child.material) child.material.needsUpdate = true;
          }
        });
        console.log("✅ GLB loaded");
      },
      undefined,
      (err) => console.error("❌ GLB error:", err)
    );

    // ── 8. DEVICE ORIENTATION → rotate Three.js camera to match phone ──
    // This makes the 3D scene align with where the phone is pointing
    let deviceAlpha = 0, deviceBeta = 90, deviceGamma = 0;

    function onOrientation(e) {
      deviceAlpha = e.alpha ?? 0;
      deviceBeta  = e.beta  ?? 90;
      deviceGamma = e.gamma ?? 0;
    }

    if (window.DeviceOrientationEvent) {
      // iOS 13+ requires permission
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        DeviceOrientationEvent.requestPermission().then((perm) => {
          if (perm === "granted") window.addEventListener("deviceorientation", onOrientation);
        });
      } else {
        window.addEventListener("deviceorientation", onOrientation);
      }
    }

    // ── 9. TAP HANDLER — place model where user taps ──────────────
    function getCanvasXY(clientX, clientY) {
      return {
        x:  (clientX / window.innerWidth)  * 2 - 1,
        y: -(clientY / window.innerHeight) * 2 + 1,
      };
    }

    function placeModel(clientX, clientY) {
      if (!preloadedModel) return;

      const { x, y } = getCanvasXY(clientX, clientY);
      raycaster.setFromCamera({ x, y }, camera);

      // Ray → virtual ground plane intersection
      if (!raycaster.ray.intersectPlane(groundPlane, planeIntersect)) return;

      const model = skeletonClone(preloadedModel);
      model.position.copy(planeIntersect);
      model.scale.set(0.3, 0.3, 0.3);
      // Face model toward camera
      model.lookAt(camera.position.x, model.position.y, camera.position.z);
      model.traverse((child) => {
        if (child.isMesh) {
          child.visible = true;
          child.frustumCulled = false;
          if (child.material) child.material.needsUpdate = true;
        }
      });
      scene.add(model);
      reticle.visible = false;
      console.log("✅ Model placed at", planeIntersect);
    }

    // Show reticle on pointer move / touch move
    function updateReticle(clientX, clientY) {
      const { x, y } = getCanvasXY(clientX, clientY);
      raycaster.setFromCamera({ x, y }, camera);
      if (raycaster.ray.intersectPlane(groundPlane, planeIntersect)) {
        reticle.position.copy(planeIntersect);
        reticle.visible = true;
      }
    }

    // Touch events (mobile)
    function onTouchStart(e) {
      e.preventDefault();
      const t = e.changedTouches[0];
      placeModel(t.clientX, t.clientY);
    }
    function onTouchMove(e) {
      e.preventDefault();
      const t = e.changedTouches[0];
      updateReticle(t.clientX, t.clientY);
    }

    // Click events (desktop testing)
    function onClick(e) { placeModel(e.clientX, e.clientY); }
    function onMouseMove(e) { updateReticle(e.clientX, e.clientY); }

    renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: false });
    renderer.domElement.addEventListener("touchmove",  onTouchMove,  { passive: false });
    renderer.domElement.addEventListener("click", onClick);
    renderer.domElement.addEventListener("mousemove", onMouseMove);

    // ── 10. ANIMATE ───────────────────────────────────────────────
    // Apply device orientation to Three.js camera so 3D content tracks
    // where the phone is pointing (critical for realistic AR feel)
    const euler = new THREE.Euler();
    const quaternion = new THREE.Quaternion();

    function animate() {
      requestAnimationFrame(animate);

      // Map device orientation → camera rotation
      // beta  = tilt up/down (0=flat, 90=upright)
      // gamma = tilt left/right
      // alpha = compass heading
      const betaRad  = THREE.MathUtils.degToRad(deviceBeta  - 90); // -90 so upright phone = looking forward
      const gammaRad = THREE.MathUtils.degToRad(deviceGamma);
      const alphaRad = THREE.MathUtils.degToRad(-deviceAlpha);

      euler.set(betaRad, alphaRad, -gammaRad, "YXZ");
      quaternion.setFromEuler(euler);
      camera.quaternion.slerp(quaternion, 0.1); // smooth

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
      const keep = new Set([reticle, dir, scene.children[0]]); // keep reticle + lights
      [...scene.children].filter((o) => !keep.has(o)).forEach((o) => scene.remove(o));
      reticle.visible = false;
    };

    // ── CLEANUP ───────────────────────────────────────────────────
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("deviceorientation", onOrientation);
      renderer.domElement.removeEventListener("touchstart", onTouchStart);
      renderer.domElement.removeEventListener("touchmove", onTouchMove);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.dispose();
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <>
      {/* Camera feed — sits behind everything */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      />
      {/* Three.js canvas — transparent, sits on top of video */}
      <div
        ref={containerRef}
        style={{ position: "fixed", inset: 0, zIndex: 1 }}
      />
    </>
  );
}