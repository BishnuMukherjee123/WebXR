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
  Quaternion,
  MeshBuilder,
  StandardMaterial,
  Color3
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";

const MODEL_URL =
  "https://iskchovltfnohyftjckg.supabase.co/storage/v1/object/public/models/10.glb";

export default function ARScene() {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [inSession, setInSession] = useState(false);
  const xrHelperRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Engine & Scene ──────────────────────────────────────────────────────
    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 0);

    const hemiLight = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 1.2;

    const dirLight = new DirectionalLight("dir", new Vector3(-1, -2, -1), scene);
    dirLight.intensity = 0.8;

    // ── Shared mutable state ────────────────────────────────────────────────
    let modelRoot = null;       // Set once GLB finishes loading
    let lastHitResult = null;   // Latest hit-test result (updated every XR frame)
    let placed = false;         // Has the user locked the model?

    // ── Reticle ─────────────────────────────────────────────────────────────
    const reticle = MeshBuilder.CreateTorus(
      "reticle",
      { diameter: 0.18, thickness: 0.012, tessellation: 32 },
      scene
    );
    reticle.isVisible = false;
    reticle.rotationQuaternion = Quaternion.Identity();

    const reticleMat = new StandardMaterial("reticleMat", scene);
    reticleMat.emissiveColor = new Color3(1, 1, 1);
    reticleMat.disableLighting = true;
    reticleMat.alpha = 0.6;
    reticle.material = reticleMat;

    // ── Load GLB ────────────────────────────────────────────────────────────
    SceneLoader.ImportMeshAsync("", MODEL_URL, "", scene)
      .then((result) => {
        modelRoot = result.meshes[0];
        modelRoot.scaling = new Vector3(0.35, 0.35, 0.35);
        // Start hidden – use setEnabled so every child mesh in the hierarchy hides
        modelRoot.setEnabled(false);
        console.log("✅ GLB loaded, total meshes:", result.meshes.length);
      })
      .catch((err) => console.error("❌ GLB load error:", err));

    // ── Place model at a world position ────────────────────────────────────
    function placeModel(position, rotationQuat) {
      if (!modelRoot) {
        console.warn("⚠️ tap ignored – model not loaded yet");
        return;
      }

      // Show the whole hierarchy
      modelRoot.setEnabled(true);
      // Force every child mesh visible (guards against lingering isVisible=false)
      modelRoot.getChildMeshes(false).forEach((m) => {
        m.isVisible = true;
      });

      // Position
      modelRoot.position.copyFrom(position);

      // Keep the model upright – only inherit the Y rotation from the surface
      const euler = rotationQuat.toEulerAngles();
      modelRoot.rotationQuaternion = null;          // switch to euler mode
      modelRoot.rotation = new Vector3(0, euler.y, 0);

      placed = true;
      reticle.isVisible = false;
      console.log("✅ Model placed at", position.toString());
    }

    // ── Reset ────────────────────────────────────────────────────────────────
    window.resetAR = () => {
      placed = false;
      lastHitResult = null;
      if (modelRoot) modelRoot.setEnabled(false);
      reticle.isVisible = true;
    };

    // ── WebXR ────────────────────────────────────────────────────────────────
    scene
      .createDefaultXRExperienceAsync({
        uiOptions: {
          sessionMode: "immersive-ar",
          referenceSpaceType: "local-floor",
        },
        optionalFeatures: true,
        disableDefaultUI: true,
        disableTeleportation: true,
        // NOTE: do NOT set disablePointerSelection – it breaks select events
      })
      .then((xr) => {
        xrHelperRef.current = xr;
        const fm = xr.baseExperience.featuresManager;

        // DOM overlay
        try {
          fm.enableFeature(WebXRFeatureName.DOM_OVERLAY, "latest", {
            element: overlayRef.current,
          });
        } catch (e) {
          console.warn("DOM_OVERLAY not supported:", e);
        }

        // Hit test
        const hitTest = fm.enableFeature(WebXRFeatureName.HIT_TEST, "latest");

        // ── Session state ─────────────────────────────────────────────────
        xr.baseExperience.onStateChangedObservable.add((state) => {
          const active = state === WebXRState.IN_XR;
          setInSession(active);
          if (!active) {
            // Tidy up when the session ends
            placed = false;
            lastHitResult = null;
            reticle.isVisible = false;
            if (modelRoot) modelRoot.setEnabled(false);
          }
        });

        // ── Hit-test: update reticle & cache result ───────────────────────
        hitTest.onHitTestResultObservable.add((results) => {
          if (results.length > 0) {
            lastHitResult = results[0];

            if (!placed) {
              reticle.isVisible = true;
              const pos = new Vector3();
              const rot = new Quaternion();
              results[0].transformationMatrix.decompose(undefined, rot, pos);
              reticle.position.copyFrom(pos);
              reticle.rotationQuaternion.copyFrom(rot);
            }
          } else {
            lastHitResult = null;
            if (!placed) reticle.isVisible = false;
          }
        });

        // ── Tap: use the native WebXR 'select' event ──────────────────────
        // scene.onPointerObservable does NOT fire for screen taps in
        // immersive-ar mode.  The correct API is the WebXR session's
        // 'select' event, which fires once per deliberate tap/click.
        xr.baseExperience.sessionManager.onXRSessionInit.add(() => {
          xr.baseExperience.sessionManager.session.addEventListener(
            "select",
            () => {
              if (placed) return;            // already locked – ignore extra taps
              if (!lastHitResult) {
                console.warn("⚠️ select fired but no hit result cached");
                return;
              }

              const pos = new Vector3();
              const rot = new Quaternion();
              lastHitResult.transformationMatrix.decompose(undefined, rot, pos);
              placeModel(pos, rot);
            }
          );
          console.log("✅ Native 'select' listener attached to XR session");
        });
      })
      .catch((err) => console.error("❌ XR setup error:", err));

    // ── Render loop ─────────────────────────────────────────────────────────
    engine.runRenderLoop(() => scene.render());

    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);

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
          width: "100%",
          height: "100%",
          display: "block",
          position: "fixed",
          inset: 0,
          outline: "none",
          touchAction: "none",
        }}
      />

      {/* DOM Overlay (visible inside AR session) */}
      <div
        ref={overlayRef}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        {inSession && (
          <>
            <div
              style={{
                position: "absolute",
                top: 20,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.55)",
                color: "#fff",
                padding: "6px 20px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: "nowrap",
                backdropFilter: "blur(8px)",
              }}
            >
              Point at a surface · Tap to place
            </div>
            <button
              onClick={() => window.resetAR?.()}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                pointerEvents: "auto",
                padding: "8px 18px",
                background: "rgba(30,30,30,0.85)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                backdropFilter: "blur(4px)",
              }}
            >
              Reset
            </button>
          </>
        )}
      </div>

      {/* Landing screen (before AR session starts) */}
      {!inSession && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#111",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
          }}
        >
          <h1 style={{ color: "#fff", fontSize: 24, marginBottom: 12 }}>
            Aroma WebXR
          </h1>
          <p
            style={{
              color: "#aaa",
              fontSize: 14,
              marginBottom: 24,
              textAlign: "center",
              maxWidth: 300,
            }}
          >
            Powered by Babylon.js · Tap a surface to place your model
          </p>
          <button
            onClick={() => {
              if (xrHelperRef.current) {
                xrHelperRef.current.baseExperience
                  .enterXRAsync("immersive-ar", "local-floor")
                  .catch(console.error);
              } else {
                alert("AR engine is still loading. Please wait a moment.");
              }
            }}
            style={{
              padding: "14px 32px",
              background: "#fff",
              color: "#000",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(255,255,255,0.25)",
            }}
          >
            Launch AR Experience
          </button>
        </div>
      )}
    </>
  );
}