import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ARButton } from "three/addons/webxr/ARButton.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { clone as skeletonClone } from "three/addons/utils/SkeletonUtils.js";

// GLB hosted on Supabase public storage (Draco-compressed)
const MODEL_URL =
  "https://iskchovltfnohyftjckg.supabase.co/storage/v1/object/public/models/10.glb";

export default function ARScene() {
  const mountRef = useRef(); // div that receives the renderer canvas

  useEffect(() => {
    const mount = mountRef.current;

    // ── 1. RENDERER ─────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    // ← The key line that enables WebXR
    renderer.xr.enabled = true;
    mount.appendChild(renderer.domElement);

    // ── 2. SCENE ────────────────────────────────────────────────────
    const scene = new THREE.Scene();

    // Hemisphere (sky/ground ambient)
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
    hemi.position.set(0, 20, 0);
    scene.add(hemi);

    // Directional (sun with shadows)
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 20;
    scene.add(dirLight);

    // Ambient fill — so GLB is always lit from all sides
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    // ── 3. CAMERA ───────────────────────────────────────────────────
    // Three.js XR manages the camera automatically when in session.
    // We still need a PerspectiveCamera for the non-XR render fallback.
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );

    // ── 4. RETICLE (surface indicator ring) ─────────────────────────
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.10, 0.15, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x00ffcc, side: THREE.DoubleSide })
    );
    reticle.matrixAutoUpdate = false; // we set its matrix directly from hit-test
    reticle.visible = false;
    scene.add(reticle);

    // ── 5. GLB LOADER ───────────────────────────────────────────────
    let preloadedGltf = null; // raw gltf.scene, cloned on each placement

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
    );
    dracoLoader.preload();

    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfLoader.load(
      MODEL_URL,
      (gltf) => {
        preloadedGltf = gltf.scene;

        // Auto-scale: normalise longest axis to 0.25 m
        const box = new THREE.Box3().setFromObject(preloadedGltf);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const s = maxDim > 0 ? 0.25 / maxDim : 1;
        preloadedGltf.userData.normalizedScale = s;

        preloadedGltf.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false;
            if (child.material) {
              child.material.needsUpdate = true;
              child.material.side = THREE.DoubleSide;
            }
          }
        });

        console.log(`✅ GLB ready — normalized scale: ${s.toFixed(4)}`);
      },
      (xhr) => {
        if (xhr.total > 0)
          console.log(`📦 GLB ${Math.round((xhr.loaded / xhr.total) * 100)}%`);
      },
      (err) => console.error("❌ GLB load error:", err)
    );

    // ── 6. AR BUTTON ────────────────────────────────────────────────
    // ARButton handles feature detection, HTTPS check, and session entry.
    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay", "light-estimation"],
      domOverlay: { root: document.body },
    });
    document.body.appendChild(arButton);

    // ── 7. HIT-TEST STATE ───────────────────────────────────────────
    // Allocate reusable objects OUTSIDE the render loop (rule: no GC pressure)
    let hitTestSource = null;
    let hitTestSourceRequested = false;
    let modelPlaced = false;
    const tempMatrix = new THREE.Matrix4(); // reused every frame

    // ── 8. SESSION LIFECYCLE ────────────────────────────────────────
    renderer.xr.addEventListener("sessionstart", async () => {
      const session = renderer.xr.getSession();

      // Request reference spaces for hit-testing
      const viewerSpace = await session.requestReferenceSpace("viewer");
      hitTestSource = await session.requestHitTestSource({
        space: viewerSpace,
      });
      hitTestSourceRequested = true;
      modelPlaced = false;

      // ── 9. TAP-TO-PLACE ───────────────────────────────────────────
      session.addEventListener("select", () => {
        if (!preloadedGltf) {
          console.warn("⚠️ Model not loaded yet");
          return;
        }
        if (!reticle.visible) return;

        const model = skeletonClone(preloadedGltf);
        const s = preloadedGltf.userData.normalizedScale ?? 1;
        model.scale.set(s, s, s);

        // Place exactly at hit-test surface position + orientation
        model.position.setFromMatrixPosition(reticle.matrix);
        model.quaternion.setFromRotationMatrix(reticle.matrix);

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false;
          }
        });

        scene.add(model);
        modelPlaced = true;
        console.log("✅ Model placed in world space");
      });

      session.addEventListener("end", () => {
        hitTestSource = null;
        hitTestSourceRequested = false;
        modelPlaced = false;
        reticle.visible = false;
        console.log("🔚 XR session ended");
      });

      console.log("🚀 XR session started");
    });

    // ── 10. XR RENDER LOOP ──────────────────────────────────────────
    // renderer.setAnimationLoop replaces window.requestAnimationFrame.
    // The callback receives (timestamp, XRFrame) — frame is non-null in XR.
    renderer.setAnimationLoop((timestamp, frame) => {
      if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        // Request hit-test source on first frame (must happen after session start)
        if (!hitTestSourceRequested && session) {
          session
            .requestReferenceSpace("viewer")
            .then((viewerSpace) =>
              session.requestHitTestSource({ space: viewerSpace })
            )
            .then((src) => {
              hitTestSource = src;
            })
            .catch(console.error);
          hitTestSourceRequested = true;
        }

        // Run hit-test every frame
        if (hitTestSource) {
          const hitTestResults = frame.getHitTestResults(hitTestSource);

          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);

            if (pose) {
              reticle.visible = true;
              // Copy the hit pose matrix directly into the reticle
              tempMatrix.fromArray(pose.transform.matrix);
              reticle.matrix.copy(tempMatrix);
            }
          } else {
            reticle.visible = false;
          }
        }
      }

      renderer.render(scene, camera);
    });

    // ── 11. RESIZE ──────────────────────────────────────────────────
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onResize);

    // ── 12. RESET helper ────────────────────────────────────────────
    window.resetAR = () => {
      const keep = new Set([hemi, dirLight, reticle]);
      [...scene.children]
        .filter((o) => !keep.has(o))
        .forEach((o) => scene.remove(o));
      // Re-add ambient which was not in the keep set (it has no reference)
      scene.add(new THREE.AmbientLight(0xffffff, 0.8));
      modelPlaced = false;
      reticle.visible = false;
      console.log("🔄 Scene reset");
    };

    // ── CLEANUP ─────────────────────────────────────────────────────
    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", onResize);

      // End XR session if active
      const session = renderer.xr.getSession();
      if (session) session.end().catch(() => {});

      renderer.dispose();
      arButton.remove();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: "fixed", inset: 0, overflow: "hidden" }}
    />
  );
}