import { useEffect, useRef } from "react";
import * as THREE from "three";
import { clone as skeletonClone } from "three/addons/utils/SkeletonUtils.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

// ── On-screen debug log so we can see errors on mobile ─────────────────────
function createDebugLog() {
  const el = document.createElement("div");
  el.id = "ar-debug-log";
  Object.assign(el.style, {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    background: "rgba(0,0,0,0.65)",
    color: "#0f0",
    fontSize: "11px",
    fontFamily: "monospace",
    padding: "4px 8px",
    zIndex: "9999",
    maxHeight: "30vh",
    overflowY: "auto",
    pointerEvents: "none",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  });
  document.body.appendChild(el);
  return (msg) => {
    const line = document.createElement("div");
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    el.appendChild(line);
    el.scrollTop = el.scrollHeight;
    console.log(msg);
  };
}

export default function ARScene() {
  const containerRef = useRef();
  const videoRef = useRef();

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    const log = createDebugLog();

    // ── 1. CAMERA FEED ────────────────────────────────────────────
    let stream = null;
    log("📷 Requesting camera...");

    // Fix React JSX bug: 'muted' prop does NOT set the DOM attribute.
    // Must be set programmatically or autoplay policy blocks video on mobile.
    video.muted = true;
    video.setAttribute("playsinline", "");        // Standard
    video.setAttribute("webkit-playsinline", ""); // iOS Safari legacy

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      .then((s) => {
        stream = s;
        video.srcObject = s;
        log("✅ Camera stream assigned");

        const tryPlay = () => {
          video.muted = true; // ensure still muted before play
          const p = video.play();
          if (p !== undefined) {
            p.then(() => log("▶️ Video playing ✅"))
             .catch((err) => {
               log(`⚠️ play() blocked: ${err.message} — retrying in 400ms…`);
               setTimeout(() => {
                 video.muted = true;
                 video.play()
                   .then(() => log("▶️ Video playing on retry ✅"))
                   .catch((e) => log(`❌ Retry failed: ${e.message}`));
               }, 400);
             });
          } else {
            log("▶️ play() called (no promise — old browser)");
          }
        };

        if (video.readyState >= 1) {
          tryPlay();
        } else {
          video.addEventListener("loadedmetadata", tryPlay, { once: true });
        }
      })
      .catch((err) => log(`❌ Camera error: ${err.name}: ${err.message}`));

    // ── 2. SCENE ──────────────────────────────────────────────────
    const scene = new THREE.Scene();

    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
    scene.add(ambientLight);
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    container.appendChild(renderer.domElement);
    log("✅ Renderer created");

    // ── 5. RETICLE ────────────────────────────────────────────────
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

    // DRACOLoader is required — the GLB uses Draco compression
    const dracoLoader = new DRACOLoader();
    // Use Google's hosted Draco decoder (works on any domain, no local files needed)
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
    dracoLoader.preload();

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    // Supabase public storage URL — reliable CDN, no GitHub/jsDelivr delays
    const MODEL_URL = "https://iskchovltfnohyftjckg.supabase.co/storage/v1/object/public/models/10.glb";
    log(`📦 Loading GLB from Supabase...`);

    loader.load(
      MODEL_URL,
      (gltf) => {
        preloadedModel = gltf.scene;

        // Compute bounding box to auto-scale the model sensibly
        const box = new THREE.Box3().setFromObject(preloadedModel);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        // Normalise to ~0.25m then scale up to 0.3m target size
        const normalise = maxDim > 0 ? 0.3 / maxDim : 1;
        preloadedModel.userData.autoScale = normalise;

        preloadedModel.traverse((child) => {
          if (child.isMesh) {
            child.frustumCulled = false;
            if (child.material) {
              child.material.needsUpdate = true;
              child.material.side = THREE.DoubleSide;
            }
          }
        });
        log(`✅ GLB loaded! Size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)} → scale ${normalise.toFixed(3)}`);
      },
      (xhr) => {
        if (xhr.total > 0)
          log(`📦 GLB: ${Math.round((xhr.loaded / xhr.total) * 100)}%`);
      },
      (err) => log(`❌ GLB load error: ${err.message || err}`)
    );

    // ── 8. DEVICE ORIENTATION ─────────────────────────────────────
    const deviceQuat = new THREE.Quaternion();
    const deviceEuler = new THREE.Euler();
    let hasOrientation = false;

    function onOrientation(e) {
      if (e.alpha === null) return;
      hasOrientation = true;
      deviceEuler.set(
        THREE.MathUtils.degToRad(e.beta  - 90),
        THREE.MathUtils.degToRad(-e.alpha),
        THREE.MathUtils.degToRad(-e.gamma),
        "YXZ"
      );
      deviceQuat.setFromEuler(deviceEuler);
    }

    if (window.DeviceOrientationEvent) {
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        DeviceOrientationEvent.requestPermission()
          .then((p) => { if (p === "granted") window.addEventListener("deviceorientation", onOrientation); })
          .catch(console.warn);
      } else {
        window.addEventListener("deviceorientation", onOrientation);
      }
    }

    // ── 9. PLACEMENT ──────────────────────────────────────────────
    function getPlacementPosition(clientX, clientY) {
      const x = (clientX / window.innerWidth)  *  2 - 1;
      const y = (clientY / window.innerHeight) * -2 + 1;
      raycaster.setFromCamera({ x, y }, camera);
      const pos = new THREE.Vector3();
      raycaster.ray.at(1.2, pos);
      return pos;
    }

    function placeModel(clientX, clientY) {
      if (!preloadedModel) {
        log("⚠️ GLB not loaded yet — tap again in a moment");
        return;
      }

      const pos = getPlacementPosition(clientX, clientY);
      const model = skeletonClone(preloadedModel);
      model.position.copy(pos);

      const s = preloadedModel.userData.autoScale ?? 0.3;
      model.scale.set(s, s, s);

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
      log(`✅ Model placed at (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`);
    }

    function onTouchEnd(e) {
      e.preventDefault();
      const t = e.changedTouches[0];
      placeModel(t.clientX, t.clientY);
    }
    function onClick(e) { placeModel(e.clientX, e.clientY); }

    renderer.domElement.addEventListener("touchend", onTouchEnd, { passive: false });
    renderer.domElement.addEventListener("click", onClick);

    // ── 10. ANIMATE ───────────────────────────────────────────────
    const smoothQuat = new THREE.Quaternion();
    let animId;

    function animate() {
      animId = requestAnimationFrame(animate);

      if (hasOrientation) {
        smoothQuat.slerp(deviceQuat, 0.08);
        camera.quaternion.copy(smoothQuat);
      }

      raycaster.setFromCamera({ x: 0, y: 0 }, camera);
      const reticlePos = new THREE.Vector3();
      raycaster.ray.at(1.2, reticlePos);
      reticle.position.copy(reticlePos);
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
      log("🔄 Scene reset");
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
      document.getElementById("ar-debug-log")?.remove();
    };
  }, []);

  return (
    <>
      {/* NOTE: autoPlay alone is not enough on mobile.
           video.muted = true is set via ref in useEffect to work around
           a React JSX bug where the muted prop does not set the DOM attribute. */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "fixed", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", zIndex: 0,
          display: "block",
        }}
      />
      <div
        ref={containerRef}
        style={{ position: "fixed", inset: 0, zIndex: 1 }}
      />
    </>
  );
}