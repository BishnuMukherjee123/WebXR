import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default function ARScene() {
  const containerRef = useRef();

  useEffect(() => {
    // ── Core Three.js objects ───────────────────────────────────────────
    let camera, scene, renderer;
    let controller1, controller2;
    let reticle;
    let preloadedModel = null;

    // ── Hit-test state (managed inside the render loop per Three.js docs) ──
    let hitTestSource = null;
    let hitTestSourceRequested = false;

    // ────────────────────────────────────────────────────────────────────
    // SCENE
    // ────────────────────────────────────────────────────────────────────
    scene = new THREE.Scene();

    // Hemisphere light (Three.js official example uses intensity 3)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
    hemiLight.position.set(0.5, 1, 0.25);
    scene.add(hemiLight);

    // Directional light for PBR material shading
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(1, 3, 2);
    scene.add(dirLight);

    // ────────────────────────────────────────────────────────────────────
    // CAMERA — near/far matches Three.js official example (0.01, 20)
    // ────────────────────────────────────────────────────────────────────
    camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );

    // ────────────────────────────────────────────────────────────────────
    // RENDERER — matches Three.js official example exactly
    // ────────────────────────────────────────────────────────────────────
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Required for GLTF/GLB PBR materials to render correctly
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;

    // Enable WebXR
    renderer.xr.enabled = true;

    containerRef.current.appendChild(renderer.domElement);

    // ────────────────────────────────────────────────────────────────────
    // AR BUTTON — Three.js official way to start immersive-ar session
    // ARButton handles: session request, hit-test feature, dom-overlay
    // ────────────────────────────────────────────────────────────────────
    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay", "local-floor"],
      domOverlay: { root: document.body },
    });
    document.body.appendChild(arButton);

    // ────────────────────────────────────────────────────────────────────
    // SELECT HANDLER — decompose reticle matrix (Three.js official method)
    // ────────────────────────────────────────────────────────────────────
    function onSelect() {
      if (!reticle.visible) return;
      if (!preloadedModel) {
        console.warn("⚠️ Model not loaded yet");
        return;
      }

      const model = skeletonClone(preloadedModel);

      // ✅ Official Three.js way: decompose the matrix into pos/quat/scale
      reticle.matrix.decompose(model.position, model.quaternion, model.scale);

      // Override scale to a fixed display size (reticle scale is tiny)
      model.scale.set(0.3, 0.3, 0.3);

      // Ensure all child meshes are visible after clone
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

    // Register both controllers (controller 1 = primary touch on mobile)
    controller1 = renderer.xr.getController(0);
    controller1.addEventListener("select", onSelect);
    scene.add(controller1);

    controller2 = renderer.xr.getController(1);
    controller2.addEventListener("select", onSelect);
    scene.add(controller2);

    // ────────────────────────────────────────────────────────────────────
    // RETICLE — exactly as Three.js official example
    // ────────────────────────────────────────────────────────────────────
    reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // ────────────────────────────────────────────────────────────────────
    // PRELOAD GLB
    // ────────────────────────────────────────────────────────────────────
    const loader = new GLTFLoader();
    loader.load(
      "/models/10.glb",
      (gltf) => {
        preloadedModel = gltf.scene;
        preloadedModel.traverse((child) => {
          if (child.isMesh) {
            child.frustumCulled = false;
            if (child.material) child.material.needsUpdate = true;
            console.log(`🧱 Mesh: "${child.name}" | ${child.material?.type}`);
          }
        });
        console.log("✅ GLB preloaded");
      },
      (xhr) => console.log(`📦 GLB loading: ${Math.round((xhr.loaded / xhr.total) * 100)}%`),
      (err) => console.error("❌ GLB load failed:", err)
    );

    // ────────────────────────────────────────────────────────────────────
    // RESIZE
    // ────────────────────────────────────────────────────────────────────
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onWindowResize);

    // ────────────────────────────────────────────────────────────────────
    // ANIMATION LOOP — hit-test source requested HERE (official Three.js
    // pattern: lazy-init inside the loop on the first XR frame)
    // ────────────────────────────────────────────────────────────────────
    function animate(timestamp, frame) {
      if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        // ── Request hit-test source on the first XR frame ────────────
        if (!hitTestSourceRequested) {
          session
            .requestReferenceSpace("viewer")
            .then((viewerSpace) => {
              session
                .requestHitTestSource({ space: viewerSpace })
                .then((source) => {
                  hitTestSource = source;
                  console.log("✅ Hit-test source ready");
                });
            });

          session.addEventListener("end", () => {
            hitTestSourceRequested = false;
            hitTestSource = null;
            console.log("⛔ XR session ended");
          });

          hitTestSourceRequested = true;
        }

        // ── Update reticle from hit results ───────────────────────────
        if (hitTestSource) {
          const hitTestResults = frame.getHitTestResults(hitTestSource);

          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
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

    // Set the loop BEFORE exposing reset — matches official example order
    renderer.setAnimationLoop(animate);

    // ────────────────────────────────────────────────────────────────────
    // GLOBAL RESET (for UI button)
    // ────────────────────────────────────────────────────────────────────
    window.resetAR = () => {
      // Remove all placed models (non-core objects)
      const toRemove = scene.children.filter(
        (obj) => obj !== reticle && obj !== controller1 && obj !== controller2 && !(obj instanceof THREE.Light)
      );
      toRemove.forEach((obj) => scene.remove(obj));
      console.log("🔄 Scene reset");
    };

    // ────────────────────────────────────────────────────────────────────
    // CLEANUP
    // ────────────────────────────────────────────────────────────────────
    return () => {
      window.removeEventListener("resize", onWindowResize);
      renderer.setAnimationLoop(null);
      arButton.remove();
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}