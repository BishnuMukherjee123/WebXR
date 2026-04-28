import { useEffect, useRef, useState } from "react";
import {
  Engine,
  Scene,
  Vector3,
  Color4,
  HemisphericLight,
  DirectionalLight,
  WebXRFeatureName,
  WebXRState,
  TransformNode,
  Quaternion,
  PointerEventTypes,
  MeshBuilder,
  StandardMaterial,
  Color3
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";

const MODEL_URL = "https://iskchovltfnohyftjckg.supabase.co/storage/v1/object/public/models/10.glb";

export default function ARScene() {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [inSession, setInSession] = useState(false);
  const xrHelperRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Babylon Engine ──────────────────────────────────────────────────────
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 0);

    const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 1.2;

    const dirLight = new DirectionalLight("dirLight", new Vector3(-1, -2, -1), scene);
    dirLight.intensity = 0.8;

    // State
    let modelRoot = null;
    let placed = false;           // Has the user tapped to lock the model?
    let placedPosition = null;    // World position where the user tapped
    let placedRotation = null;    // World rotation at the tap point
    let lastHitResult = null;     // Latest hit test result from the current frame
    let isPlacing = false;

    // ── Reticle ─────────────────────────────────────────────────────────────
    const reticle = MeshBuilder.CreateTorus("reticle", {
      diameter: 0.18,
      thickness: 0.012,
      tessellation: 32
    }, scene);
    reticle.isVisible = false;
    reticle.rotationQuaternion = Quaternion.Identity();

    const reticleMat = new StandardMaterial("reticleMat", scene);
    reticleMat.emissiveColor = new Color3(1, 1, 1);
    reticleMat.disableLighting = true;
    reticleMat.alpha = 0.6;
    reticle.material = reticleMat;

    // ── Load GLB Model ───────────────────────────────────────────────────────
    SceneLoader.ImportMeshAsync("", MODEL_URL, "", scene).then((result) => {
      modelRoot = result.meshes[0];
      modelRoot.scaling = new Vector3(0.35, 0.35, 0.35);
      modelRoot.isVisible = false; // hide all children via the root mesh
      modelRoot.setEnabled(false);
      console.log("✅ GLB Loaded");
    }).catch(err => console.error("❌ GLB Load Error:", err));

    // ── WebXR ────────────────────────────────────────────────────────────────
    scene.createDefaultXRExperienceAsync({
      uiOptions: {
        sessionMode: "immersive-ar",
        referenceSpaceType: "local-floor"
      },
      optionalFeatures: true,
      disableDefaultUI: true,
      disableTeleportation: true,
      disablePointerSelection: true
    }).then((xr) => {
      xrHelperRef.current = xr;
      const fm = xr.baseExperience.featuresManager;

      // DOM Overlay
      try {
        fm.enableFeature(WebXRFeatureName.DOM_OVERLAY, "latest", {
          element: overlayRef.current
        });
      } catch (e) {
        console.warn("DOM_OVERLAY not supported:", e);
      }

      // Hit Test
      const hitTest = fm.enableFeature(WebXRFeatureName.HIT_TEST, "latest");

      xr.baseExperience.onStateChangedObservable.add((state) => {
        setInSession(state === WebXRState.IN_XR);
        if (state !== WebXRState.IN_XR) {
          // Session ended - reset state
          placed = false;
          placedPosition = null;
          placedRotation = null;
          reticle.isVisible = false;
          if (modelRoot) modelRoot.setEnabled(false);
        }
      });

      // ── Hit Test Observable ─────────────────────────────────────────────
      hitTest.onHitTestResultObservable.add((results) => {
        if (results.length > 0) {
          lastHitResult = results[0];

          if (!placed) {
            // Show reticle at hit position
            reticle.isVisible = true;
            const pos = new Vector3();
            const rot = new Quaternion();
            results[0].transformationMatrix.decompose(undefined, rot, pos);
            reticle.position.copyFrom(pos);
            // Lay the torus flat on the surface
            reticle.rotationQuaternion.copyFrom(rot);
          }
        } else {
          lastHitResult = null;
          if (!placed) reticle.isVisible = false;
        }
      });

      // ── Tap to Place ────────────────────────────────────────────────────
      scene.onPointerObservable.add(async (pointerInfo) => {
        if (pointerInfo.type !== PointerEventTypes.POINTERDOWN) return;
        if (xr.baseExperience.state !== WebXRState.IN_XR) return;
        if (!modelRoot || isPlacing || !lastHitResult) return;

        isPlacing = true;
        try {
          const pos = new Vector3();
          const rot = new Quaternion();
          lastHitResult.transformationMatrix.decompose(undefined, rot, pos);

          placedPosition = pos.clone();
          placedRotation = rot.clone();

          // Place model directly at hit point
          modelRoot.setEnabled(true);
          modelRoot.position.copyFrom(placedPosition);

          // The GLTF __root__ node already has a 90-degree rotation baked in.
          // We only apply the Y-component of the surface normal rotation so the
          // model always stands upright and faces the right direction.
          const euler = rot.toEulerAngles();
          modelRoot.rotation = new Vector3(0, euler.y, 0);
          modelRoot.rotationQuaternion = null; // use euler rotation

          placed = true;
          reticle.isVisible = false; // hide reticle after placing

          console.log("✅ Model placed at", pos.toString());
        } catch (e) {
          console.error("⚠️ Placement failed:", e);
        } finally {
          isPlacing = false;
        }
      });
    }).catch(err => console.error("❌ XR Setup Error:", err));

    // ── Render Loop ──────────────────────────────────────────────────────────
    engine.runRenderLoop(() => scene.render());

    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);

    window.resetAR = () => {
      placed = false;
      placedPosition = null;
      placedRotation = null;
      if (modelRoot) modelRoot.setEnabled(false);
      reticle.isVisible = !!lastHitResult;
    };

    return () => {
      window.removeEventListener("resize", onResize);
      engine.dispose();
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%", height: "100%",
          display: "block", position: "fixed",
          inset: 0, outline: "none", touchAction: "none"
        }}
      />

      {/* DOM Overlay */}
      <div
        ref={overlayRef}
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10 }}
      >
        {inSession && (
          <>
            <div style={{
              position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.55)", color: "#fff", padding: "6px 20px",
              borderRadius: 20, fontSize: 13, fontWeight: 500, whiteSpace: "nowrap",
              backdropFilter: "blur(8px)"
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
                cursor: "pointer", backdropFilter: "blur(4px)"
              }}
            >
              Reset
            </button>
          </>
        )}
      </div>

      {/* Landing */}
      {!inSession && (
        <div style={{
          position: "fixed", inset: 0, background: "#111",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", zIndex: 20
        }}>
          <h1 style={{ color: "#fff", fontSize: 24, marginBottom: 12 }}>Aroma WebXR</h1>
          <p style={{ color: "#aaa", fontSize: 14, marginBottom: 24, textAlign: "center", maxWidth: 300 }}>
            Powered by Babylon.js · Tap a surface to place your model
          </p>
          <button
            onClick={() => {
              if (xrHelperRef.current) {
                xrHelperRef.current.baseExperience.enterXRAsync("immersive-ar", "local-floor")
                  .catch(console.error);
              } else {
                alert("AR engine is still loading. Please wait a moment.");
              }
            }}
            style={{
              padding: "14px 32px", background: "#fff", color: "#000",
              border: "none", borderRadius: 12, fontSize: 16,
              fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 20px rgba(255,255,255,0.25)"
            }}
          >
            Launch AR Experience
          </button>
        </div>
      )}
    </>
  );
}