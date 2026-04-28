import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ARButton } from "three/addons/webxr/ARButton.js";
import { clone as skeletonClone } from "three/addons/utils/SkeletonUtils.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default function ARScene() {
  const containerRef = useRef();

  useEffect(() => {
    const container = containerRef.current;

    // ── Scene ─────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    let controller1, controller2, reticle;
    let preloadedModel = null;
    let hitTestSource = null;
    let hitTestSourceRequested = false;

    // ── Lights ────────────────────────────────────────────────────
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
    hemiLight.position.set(0.5, 1, 0.25);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(1, 3, 2);
    scene.add(dirLight);

    // ── Camera ────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    // ── Renderer ──────────────────────────────────────────────────
    // alpha: true  → canvas has alpha channel (transparent where nothing is drawn)
    // premultipliedAlpha: false → required on Android Chrome for correct AR blending
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // CRITICAL: alpha=0 clear color → canvas pixels are transparent where
    // no 3D content exists, allowing the XR camera feed to show through.
    renderer.setClearColor(0x000000, 0);

    // Correct PBR rendering for GLTF/GLB models
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // ── AR Button ─────────────────────────────────────────────────
    // CRITICAL: Use a dedicated transparent div as domOverlay root.
    // Using document.body (which has background:#000) as the root causes
    // the black background to render as an overlay ON TOP of the camera feed.
    const arOverlay = document.getElementById("ar-overlay");

    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay", "local-floor", "bounded-floor"],
      domOverlay: { root: arOverlay },
    });
    document.body.appendChild(arButton);

    // ── Controllers / Tap Handler ─────────────────────────────────
    function onSelect() {
      if (!reticle || !reticle.visible) return;
      if (!preloadedModel) {
        console.warn("⚠️ Model not ready yet");
        return;
      }
      const model = skeletonClone(preloadedModel);
      reticle.matrix.decompose(model.position, model.quaternion, model.scale);
      model.scale.set(0.3, 0.3, 0.3);
      model.traverse((child) => {
        if (child.isMesh) {
          child.visible = true;
          child.frustumCulled = false;
          if (child.material) child.material.needsUpdate = true;
        }
      });
      scene.add(model);
      console.log("✅ Model placed at", model.position);
    }

    controller1 = renderer.xr.getController(0);
    controller1.addEventListener("select", onSelect);
    scene.add(controller1);

    controller2 = renderer.xr.getController(1);
    controller2.addEventListener("select", onSelect);
    scene.add(controller2);

    // ── Reticle ───────────────────────────────────────────────────
    reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // ── Preload GLB ───────────────────────────────────────────────
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
        console.log("✅ GLB preloaded");
      },
      undefined,
      (err) => console.error("❌ GLB failed:", err)
    );

    // ── Resize ────────────────────────────────────────────────────
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onWindowResize);

    // ── Animation Loop (official Three.js AR pattern) ─────────────
    function animate(timestamp, frame) {
      if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if (!hitTestSourceRequested) {
          session
            .requestReferenceSpace("viewer")
            .then((vs) => session.requestHitTestSource({ space: vs }))
            .then((src) => { hitTestSource = src; });

          session.addEventListener("end", () => {
            hitTestSourceRequested = false;
            hitTestSource = null;
          });
          hitTestSourceRequested = true;
        }

        if (hitTestSource) {
          const results = frame.getHitTestResults(hitTestSource);
          if (results.length > 0) {
            reticle.visible = true;
            reticle.matrix.fromArray(results[0].getPose(referenceSpace).transform.matrix);
          } else {
            reticle.visible = false;
          }
        }
      }
      renderer.render(scene, camera);
    }

    renderer.setAnimationLoop(animate);

    // ── Reset ─────────────────────────────────────────────────────
    window.resetAR = () => {
      const keep = new Set([reticle, controller1, controller2]);
      scene.children
        .filter((o) => !keep.has(o) && !(o instanceof THREE.Light))
        .forEach((o) => scene.remove(o));
    };

    // ── Cleanup ───────────────────────────────────────────────────
    return () => {
      window.removeEventListener("resize", onWindowResize);
      renderer.setAnimationLoop(null);
      renderer.dispose();
      arButton.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: "fixed", inset: 0, overflow: "hidden" }}
    />
  );
}