import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ARButton } from "three/addons/webxr/ARButton.js";
import { clone as skeletonClone } from "three/addons/utils/SkeletonUtils.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default function ARScene() {
  const containerRef = useRef();

  useEffect(() => {
    const container = containerRef.current;

    // ── Core Three.js objects ─────────────────────────────────────
    const scene = new THREE.Scene();
    let controller1, controller2, reticle;
    let preloadedModel = null;
    let hitTestSource = null;
    let hitTestSourceRequested = false;

    // ── Lights ────────────────────────────────────────────────────
    // HemisphereLight: official Three.js AR example uses intensity 3
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
    hemiLight.position.set(0.5, 1, 0.25);
    scene.add(hemiLight);

    // DirectionalLight: needed for PBR (MeshStandardMaterial) shading
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(1, 3, 2);
    scene.add(dirLight);

    // ── Camera ────────────────────────────────────────────────────
    // near/far per Three.js official AR example: 0.01, 20
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );

    // ── Renderer ──────────────────────────────────────────────────
    // alpha:true — canvas is transparent so camera feed shows through
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Required for correct PBR/GLB rendering (avoids black models)
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // ── AR Button ─────────────────────────────────────────────────
    // Official Three.js way: ARButton handles session lifecycle.
    // requiredFeatures: ['hit-test'] enables surface detection.
    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay", "local-floor", "bounded-floor"],
      domOverlay: { root: document.body },
    });
    document.body.appendChild(arButton);

    // ── Select / place model ──────────────────────────────────────
    function onSelect() {
      if (!reticle || !reticle.visible) return;
      if (!preloadedModel) {
        console.warn("⚠️ Model not ready yet");
        return;
      }

      const model = skeletonClone(preloadedModel);

      // Official decompose pattern from Three.js webxr_ar_hittest.html
      reticle.matrix.decompose(model.position, model.quaternion, model.scale);
      // Force a visible scale (decomposed scale from reticle is ~0)
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

    // Register both controllers (index 0 = primary touch on phone)
    controller1 = renderer.xr.getController(0);
    controller1.addEventListener("select", onSelect);
    scene.add(controller1);

    controller2 = renderer.xr.getController(1);
    controller2.addEventListener("select", onSelect);
    scene.add(controller2);

    // ── Reticle (surface indicator ring) ─────────────────────────
    // Matches Three.js official example exactly
    reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // ── Preload GLB ───────────────────────────────────────────────
    const loader = new GLTFLoader();
    loader.load(
      "/models/10.glb",
      (gltf) => {
        preloadedModel = gltf.scene;
        preloadedModel.traverse((child) => {
          if (child.isMesh) {
            child.frustumCulled = false;
            if (child.material) child.material.needsUpdate = true;
            console.log(`🧱 Mesh loaded: "${child.name}" | ${child.material?.type}`);
          }
        });
        console.log("✅ GLB preloaded successfully");
      },
      (xhr) => {
        if (xhr.total > 0)
          console.log(`📦 GLB: ${Math.round((xhr.loaded / xhr.total) * 100)}%`);
      },
      (err) => console.error("❌ GLB failed to load:", err)
    );

    // ── Resize ────────────────────────────────────────────────────
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onWindowResize);

    // ── Animation Loop ────────────────────────────────────────────
    // Per Three.js official docs: hit-test source is lazily requested
    // on the FIRST XR frame (not upfront), using hitTestSourceRequested flag.
    function animate(timestamp, frame) {
      if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        // Request hit-test source once, on first XR frame
        if (!hitTestSourceRequested) {
          session
            .requestReferenceSpace("viewer")
            .then((viewerSpace) =>
              session
                .requestHitTestSource({ space: viewerSpace })
                .then((source) => {
                  hitTestSource = source;
                  console.log("✅ Hit-test source ready");
                })
            );

          session.addEventListener("end", () => {
            hitTestSourceRequested = false;
            hitTestSource = null;
          });

          hitTestSourceRequested = true;
        }

        // Update reticle position from hit results
        if (hitTestSource) {
          const results = frame.getHitTestResults(hitTestSource);
          if (results.length > 0) {
            const hit = results[0];
            reticle.visible = true;
            reticle.matrix.fromArray(
              hit.getPose(referenceSpace).transform.matrix
            );
          } else {
            reticle.visible = false;
          }
        }
      }

      renderer.render(scene, camera);
    }

    renderer.setAnimationLoop(animate);

    // ── Global reset (called from UIOverlay) ──────────────────────
    window.resetAR = () => {
      const keep = new Set([reticle, controller1, controller2]);
      scene.children
        .filter((o) => !keep.has(o) && !(o instanceof THREE.Light))
        .forEach((o) => scene.remove(o));
      console.log("🔄 Scene reset");
    };

    // ── Cleanup ───────────────────────────────────────────────────
    return () => {
      window.removeEventListener("resize", onWindowResize);
      renderer.setAnimationLoop(null);
      renderer.dispose();
      if (arButton.parentNode) arButton.parentNode.removeChild(arButton);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    />
  );
}