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
      model.userData.s = maxDim > 0 ? 0.25 / maxDim : 1;
      model.traverse((c) => {
        if (c.isMesh) {
          c.frustumCulled = false;
          if (c.material) { c.material.side = THREE.DoubleSide; c.material.needsUpdate = true; }
        }
      });
      console.log("✅ GLB ready");
    }, undefined, (e) => console.error("❌ GLB:", e));

    // ── Controller — Three.js XR tap approach (not session.select) ─
    const controller = renderer.xr.getController(0);
    controller.addEventListener("select", () => {
      if (!model || !reticle.visible) return;
      const clone = skeletonClone(model);
      const s = model.userData.s ?? 0.25;
      clone.scale.set(s, s, s);
      clone.position.setFromMatrixPosition(reticle.matrix);
      clone.quaternion.setFromRotationMatrix(reticle.matrix);
      clone.traverse((c) => { if (c.isMesh) c.frustumCulled = false; });
      scene.add(clone);
      console.log("✅ Placed");
    });
    scene.add(controller);

    // ── AR Button ────────────────────────────────────────────────
    const btn = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: overlay },
    });
    document.body.appendChild(btn);

    // ── Session lifecycle ─────────────────────────────────────────
    renderer.xr.addEventListener("sessionstart", () => setInSession(true));
    renderer.xr.addEventListener("sessionend", () => {
      hitTestSource = null;
      hitTestSourceRequested = false;
      reticle.visible = false;
      setInSession(false);
    });

    // ── Hit-test state (initialized inside loop — Three.js official pattern) ─
    let hitTestSource = null;
    let hitTestSourceRequested = false;

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
          } else {
            reticle.visible = false;
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