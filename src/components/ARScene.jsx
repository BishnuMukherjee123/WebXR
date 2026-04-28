import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ARButton } from "three/addons/webxr/ARButton.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { clone as skeletonClone } from "three/addons/utils/SkeletonUtils.js";

const MODEL_URL =
  "https://iskchovltfnohyftjckg.supabase.co/storage/v1/object/public/models/10.glb";

export default function ARScene() {
  const mountRef = useRef();
  const overlayRef = useRef();
  const [inSession, setInSession] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    const overlay = overlayRef.current;

    // ── Scene & lights ───────────────────────────────────────────
    const scene = new THREE.Scene();
    const hemi = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
    hemi.position.set(0.5, 1, 0.25);
    scene.add(hemi);
    // Extra directional light so model is clearly lit from all sides
    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.position.set(2, 4, 3);
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));

    const camera = new THREE.PerspectiveCamera(
      70, window.innerWidth / window.innerHeight, 0.01, 20
    );

    // ── Renderer — EXACT pattern from Three.js official AR example ──
    // DO NOT add setClearColor / toneMapping / outputColorSpace here.
    // The XR compositor handles the camera feed; extras break alpha compositing.
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    mount.appendChild(renderer.domElement);

    // ── Reticle ──────────────────────────────────────────────────
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.10, 0.15, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x00ffcc, side: THREE.DoubleSide })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // ── Load GLB ─────────────────────────────────────────────────
    let model = null;
    const draco = new DRACOLoader();
    draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(draco);
    gltfLoader.load(MODEL_URL, (gltf) => {
      model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      // Target 0.40m (40cm) — a food dish should be clearly visible in AR.
      // Previous 0.25m was too small; food plates are ~25-30cm real size,
      // so 40cm gives a clear, realistic-looking object.
      model.userData.s = maxDim > 0 ? 0.40 / maxDim : 1;
      console.log(`✅ GLB ready. size=${maxDim.toFixed(3)} → scale=${model.userData.s.toFixed(3)}`);
      model.traverse((c) => {
        if (c.isMesh) {
          c.frustumCulled = false;
          if (c.material) { c.material.side = THREE.DoubleSide; c.material.needsUpdate = true; }
        }
      });
    }, undefined, (e) => console.error("❌ GLB:", e));

    // ── Controller — Three.js XR tap approach ────────────────────
    // placedModel + placedAnchor track the current placement.
    // XR Anchors (if supported) pin the model to a real-world point;
    // ARCore continuously updates the anchor pose to correct tracking drift,
    // making the model stay exactly where you tapped.
    let placedModel = null;
    let placedAnchor = null;
    let lastHitResult = null; // stores the XRHitTestResult for anchor creation

    const controller = renderer.xr.getController(0);
    controller.addEventListener("select", async () => {
      if (!model) { console.warn("⚠️ Model not loaded"); return; }

      // Clean up previous placement
      if (placedAnchor) {
        placedAnchor.delete();
        placedAnchor = null;
      }
      if (placedModel) {
        scene.remove(placedModel);
        placedModel = null;
      }

      const clone = skeletonClone(model);
      const s = model.userData.s ?? 1;
      clone.scale.set(s, s, s);
      clone.matrixAutoUpdate = false; // We'll drive it from the anchor pose

      if (reticle.visible && lastHitResult) {
        // ── Try XR Anchor (best stability) ───────────────────────
        try {
          const anchor = await lastHitResult.createAnchor();
          placedAnchor = anchor;
          // Initial position from reticle so model appears immediately
          clone.position.setFromMatrixPosition(reticle.matrix);
          clone.quaternion.setFromRotationMatrix(reticle.matrix);
          clone.updateMatrix();
          console.log("⚓ Anchor created — model is world-locked");
        } catch (e) {
          // Anchor API not supported — fall back to static placement
          console.warn("⚠️ Anchors not supported, using static placement:", e.message);
          clone.matrixAutoUpdate = true;
          clone.position.setFromMatrixPosition(reticle.matrix);
          clone.quaternion.setFromRotationMatrix(reticle.matrix);
        }
      } else {
        // Fallback: place 1.2m in front of camera
        clone.matrixAutoUpdate = true;
        const camPos = new THREE.Vector3();
        const camDir = new THREE.Vector3();
        renderer.xr.getCamera().getWorldPosition(camPos);
        renderer.xr.getCamera().getWorldDirection(camDir);
        clone.position.copy(camPos).addScaledVector(camDir, 1.2);
        console.warn("⚠️ No surface — placed 1.2m in front");
      }

      clone.traverse((c) => { if (c.isMesh) c.frustumCulled = false; });
      scene.add(clone);
      placedModel = clone;
      console.log("✅ Placed at", clone.position);
    });
    scene.add(controller);

    // ── AR Button ────────────────────────────────────────────────
    const btn = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay", "anchors"], // anchors = world-locked placement
      domOverlay: { root: overlay },
    });
    document.body.appendChild(btn);

    // ── Session lifecycle ─────────────────────────────────────────
    renderer.xr.addEventListener("sessionstart", () => setInSession(true));
    renderer.xr.addEventListener("sessionend", () => {
      hitTestSource = null;
      hitTestSourceRequested = false;
      reticle.visible = false;
      lastHitResult = null;
      if (placedAnchor) { placedAnchor.delete(); placedAnchor = null; }
      setInSession(false);
    });

    // ── Hit-test state (initialized inside loop — Three.js official pattern) ─
    let hitTestSource = null;
    let hitTestSourceRequested = false;

    // Pre-allocated temp objects for anchor matrix math (avoids GC per frame).
    // Each frame we decompose the anchor's 4x4 pose matrix into position + quaternion,
    // then re-compose with the user-defined scale. This keeps the model
    // world-locked at exactly the tapped point with the correct size.
    const _aPos  = new THREE.Vector3();    // anchor world position
    const _aQuat = new THREE.Quaternion(); // anchor world rotation
    const _aScl  = new THREE.Vector3();   // temp — anchor has no user scale, ignored
    const _aMat  = new THREE.Matrix4();   // scratch matrix
    const _aScaleVec = new THREE.Vector3(); // reused scale vector for compose()

    // ── Animation loop — EXACT Three.js official example pattern ──
    renderer.setAnimationLoop((timestamp, frame) => {
      if (frame) {
        const refSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if (!hitTestSourceRequested) {
          session.requestReferenceSpace("viewer").then((vs) =>
            session.requestHitTestSource({ space: vs }).then((src) => {
              hitTestSource = src;
            })
          );
          session.addEventListener("end", () => {
            hitTestSourceRequested = false;
            hitTestSource = null;
          });
          hitTestSourceRequested = true;
        }

        if (hitTestSource) {
          const results = frame.getHitTestResults(hitTestSource);
          if (results.length > 0) {
            const pose = results[0].getPose(refSpace);
            reticle.visible = true;
            reticle.matrix.fromArray(pose.transform.matrix);
            lastHitResult = results[0]; // save for anchor creation on tap
          } else {
            reticle.visible = false;
            lastHitResult = null;
          }
        }

        // ── World-lock: update model matrix from anchor pose every frame ──
        //
        // MATH EXPLANATION:
        // anchorPose.transform.matrix is a column-major 4×4 matrix:
        //   [ R  | t ]   where R = 3×3 rotation, t = translation (world position)
        //   [ 0  | 1 ]
        //
        // We CANNOT just do matrix.fromArray() then matrix.scale() because
        // Matrix4.scale(v) MULTIPLIES each column by v — applying scale every
        // frame causes exponential growth (model flies away).
        //
        // CORRECT approach:
        //   1. decompose() → extracts pos + quat + (ignored anchor scale=1)
        //   2. compose(pos, quat, userScale) → builds correct matrix once
        //
        if (placedAnchor && placedModel && frame.trackedAnchors?.has(placedAnchor)) {
          const anchorPose = frame.getPose(placedAnchor.anchorSpace, refSpace);
          if (anchorPose) {
            const s = model?.userData.s ?? 1;
            // Step 1: extract pos + rotation from the 4×4 anchor pose matrix
            _aMat.fromArray(anchorPose.transform.matrix);
            _aMat.decompose(_aPos, _aQuat, _aScl); // _aScl is unit (1,1,1), ignored
            // Step 2: compose model matrix = anchor position + anchor rotation + user scale
            _aScaleVec.set(s, s, s);
            placedModel.matrix.compose(_aPos, _aQuat, _aScaleVec);
            placedModel.matrixWorldNeedsUpdate = true;
          }
        }
      }
      renderer.render(scene, camera);
    });

    // ── Resize ───────────────────────────────────────────────────
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // ── Reset ────────────────────────────────────────────────────
    window.resetAR = () => {
      [...scene.children]
        .filter((o) => o !== reticle && o !== controller && !o.isLight)
        .forEach((o) => scene.remove(o));
      if (placedAnchor) { placedAnchor.delete(); placedAnchor = null; }
      placedModel = null;
      lastHitResult = null;
      reticle.visible = false;
    };

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", onResize);
      renderer.xr.getSession()?.end().catch(() => {});
      renderer.dispose();
      btn.remove();
    };
  }, []);

  return (
    <>
      {/* Three.js canvas mount */}
      <div ref={mountRef} style={{ position: "fixed", inset: 0 }} />

      {/* dom-overlay root — the ONLY DOM content visible during XR session */}
      <div
        ref={overlayRef}
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10 }}
      >
        {inSession && (
          <>
            <div style={{
              position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.5)", color: "#fff", padding: "6px 18px",
              borderRadius: 20, fontSize: 13, fontWeight: 500, whiteSpace: "nowrap",
              backdropFilter: "blur(6px)",
            }}>
              Point at a surface · Tap to place
            </div>
            <button
              onClick={() => window.resetAR?.()}
              style={{
                position: "absolute", top: 16, right: 16, pointerEvents: "auto",
                padding: "8px 18px", background: "rgba(30,30,30,0.85)",
                color: "#fff", border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: "pointer", backdropFilter: "blur(4px)",
              }}
            >
              Reset
            </button>
          </>
        )}
      </div>

      {/* Landing screen — NOT inside dom-overlay, hidden during session via inSession */}
      {!inSession && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "radial-gradient(ellipse at 60% 40%, #0d1f2d 0%, #060d12 100%)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 20, fontFamily: "system-ui, sans-serif",
          pointerEvents: "none",
        }}>
          <div style={{
            width: 120, height: 120, borderRadius: "50%",
            border: "2px solid rgba(0,255,200,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 60px rgba(0,255,200,0.12)",
          }}>
            <div style={{ width: 75, height: 75, borderRadius: "50%", border: "2px solid rgba(0,255,200,0.2)" }} />
          </div>
          <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 700, margin: 0 }}>WebAR</h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, margin: 0 }}>
            Tap START AR · Chrome Android · ARCore required
          </p>
        </div>
      )}
    </>
  );
}