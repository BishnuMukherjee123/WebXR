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
  const [status, setStatus] = useState("loading"); // loading | ready | session | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const mount = mountRef.current;

    // ── Check WebXR support ──────────────────────────────────────
    if (!navigator.xr) {
      setStatus("error");
      setErrorMsg("WebXR not supported. Use Chrome on Android with ARCore.");
      return;
    }

    navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
      if (!supported) {
        setStatus("error");
        setErrorMsg("immersive-ar not supported on this device/browser.");
        return;
      }
      setStatus("ready");
    });

    // ── Renderer ────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    // CRITICAL for WebXR AR passthrough:
    // alpha:true alone is NOT enough — must explicitly clear to transparent.
    // Tone mapping must be NoToneMapping; ACESFilmic shifts the alpha channel
    // in the XR framebuffer and blacks out the camera passthrough.
    renderer.setClearColor(0x000000, 0);   // ← transparent clear
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping; // ← no tone mapping in XR
    renderer.xr.enabled = true;
    mount.appendChild(renderer.domElement);

    // ── Scene ───────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    const camera = new THREE.PerspectiveCamera(
      70, window.innerWidth / window.innerHeight, 0.01, 20
    );

    // ── Reticle ─────────────────────────────────────────────────
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.10, 0.15, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x00ffcc, side: THREE.DoubleSide })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // ── Load GLB ────────────────────────────────────────────────
    let preloadedGltf = null;
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.6/");
    dracoLoader.preload();
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    gltfLoader.load(MODEL_URL, (gltf) => {
      preloadedGltf = gltf.scene;
      const box = new THREE.Box3().setFromObject(preloadedGltf);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      preloadedGltf.userData.scale = maxDim > 0 ? 0.25 / maxDim : 1;
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
      console.log("✅ GLB ready");
    }, undefined, (err) => console.error("❌ GLB error:", err));

    // ── AR Button (hit-test as OPTIONAL so more devices work) ───
    const arButton = ARButton.createButton(renderer, {
      optionalFeatures: ["hit-test", "dom-overlay", "light-estimation"],
      domOverlay: { root: document.body },
    });
    document.body.appendChild(arButton);

    // ── Hit-test state (pre-allocated, no GC in loop) ────────────
    let hitTestSource = null;
    let hitTestSourceRequested = false;
    const tempMatrix = new THREE.Matrix4();

    // ── Session start ────────────────────────────────────────────
    renderer.xr.addEventListener("sessionstart", async () => {
      setStatus("session");
      const session = renderer.xr.getSession();

      // Request hit-test source (graceful if not supported)
      try {
        const viewerSpace = await session.requestReferenceSpace("viewer");
        hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
        hitTestSourceRequested = true;
        console.log("✅ Hit-test source ready");
      } catch (e) {
        console.warn("⚠️ Hit-test not available:", e.message);
      }

      // Tap to place
      session.addEventListener("select", () => {
        if (!preloadedGltf) return;
        if (!reticle.visible && hitTestSource) return; // if hit-test works, require reticle

        const model = skeletonClone(preloadedGltf);
        const s = preloadedGltf.userData.scale ?? 0.25;
        model.scale.set(s, s, s);
        model.position.setFromMatrixPosition(reticle.visible ? reticle.matrix : camera.matrixWorld);
        if (reticle.visible) {
          model.quaternion.setFromRotationMatrix(reticle.matrix);
        }
        model.traverse((child) => {
          if (child.isMesh) { child.castShadow = true; child.frustumCulled = false; }
        });
        scene.add(model);
        console.log("✅ Model placed");
      });

      session.addEventListener("end", () => {
        hitTestSource = null;
        hitTestSourceRequested = false;
        reticle.visible = false;
        setStatus("ready");
        console.log("🔚 Session ended");
      });
    });

    // ── XR render loop ───────────────────────────────────────────
    renderer.setAnimationLoop((timestamp, frame) => {
      if (frame && hitTestSource) {
        const refSpace = renderer.xr.getReferenceSpace();
        const results = frame.getHitTestResults(hitTestSource);
        if (results.length > 0) {
          const pose = results[0].getPose(refSpace);
          if (pose) {
            reticle.visible = true;
            tempMatrix.fromArray(pose.transform.matrix);
            reticle.matrix.copy(tempMatrix);
          }
        } else {
          reticle.visible = false;
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
      const keep = new Set([...scene.children.slice(0, 4)]); // lights + reticle
      [...scene.children].filter((o) => !keep.has(o)).forEach((o) => scene.remove(o));
      reticle.visible = false;
    };

    return () => {
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", onResize);
      const session = renderer.xr.getSession();
      if (session) session.end().catch(() => {});
      renderer.dispose();
      arButton.remove();
    };
  }, []);

  return (
    <>
      {/* Three.js canvas mount */}
      <div ref={mountRef} style={{ position: "fixed", inset: 0 }} />

      {/* Landing screen — visible until session starts */}
      {status !== "session" && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "radial-gradient(ellipse at 60% 40%, #0d1f2d 0%, #060d12 100%)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 16, pointerEvents: "none",
          fontFamily: "system-ui, sans-serif",
        }}>
          {/* Decorative ring */}
          <div style={{
            width: 120, height: 120, borderRadius: "50%",
            border: "2px solid rgba(0,255,200,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 40px rgba(0,255,200,0.15)",
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              border: "2px solid rgba(0,255,200,0.2)",
            }} />
          </div>

          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 700, margin: 0 }}>
            WebAR Experience
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: 0, textAlign: "center", maxWidth: 260 }}>
            {status === "loading" && "Checking AR support…"}
            {status === "ready" && "Tap the button below to enter AR"}
            {status === "error" && (errorMsg || "AR not available")}
          </p>

          {status === "error" && (
            <p style={{
              color: "#ff6b6b", fontSize: 12, maxWidth: 280,
              textAlign: "center", padding: "8px 16px",
              background: "rgba(255,100,100,0.1)",
              border: "1px solid rgba(255,100,100,0.3)",
              borderRadius: 8, margin: 0,
            }}>
              {errorMsg}
            </p>
          )}
        </div>
      )}

      {/* In-session hint */}
      {status === "session" && (
        <div style={{
          position: "fixed", top: 20, left: "50%",
          transform: "translateX(-50%)", zIndex: 9999,
          background: "rgba(0,0,0,0.55)", color: "#fff",
          fontSize: 13, fontWeight: 500, padding: "6px 18px",
          borderRadius: 20, pointerEvents: "none",
          backdropFilter: "blur(6px)", whiteSpace: "nowrap",
        }}>
          Point at a surface · Tap to place
        </div>
      )}

      {/* Reset button (in-session only) */}
      {status === "session" && (
        <button
          onClick={() => window.resetAR?.()}
          style={{
            position: "fixed", top: 16, right: 16, zIndex: 9999,
            padding: "8px 18px", background: "rgba(40,40,40,0.85)",
            color: "#fff", border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: "pointer", backdropFilter: "blur(4px)",
          }}
        >
          Reset
        </button>
      )}
    </>
  );
}