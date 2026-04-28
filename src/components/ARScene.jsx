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
  Color3,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";

const MODEL_URL =
  "https://iskchovltfnohyftjckg.supabase.co/storage/v1/object/public/models/10.glb";

export default function ARScene() {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [inSession, setInSession] = useState(false);
  const [surfaceFound, setSurfaceFound] = useState(false);
  const xrHelperRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Engine & Scene ──────────────────────────────────────────────────
    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 0);

    new HemisphericLight("hemi", new Vector3(0, 1, 0), scene).intensity = 1.2;
    const dir = new DirectionalLight("dir", new Vector3(-1, -2, -1), scene);
    dir.intensity = 0.8;

    // ── Mutable placement state ─────────────────────────────────────────
    let modelRoot = null;       // populated once GLB loads
    let lastHitResult = null;   // most recent hit-test frame result
    let isModelPlaced = false;  // true after first confirmed tap
    let selectCleanup = null;   // function to remove the select listener

    // ── Reticle (larger, flat ring on the floor) ────────────────────────
    const reticle = MeshBuilder.CreateDisc("reticle", { radius: 0.25, tessellation: 48 }, scene);
    reticle.isVisible = false;
    reticle.rotationQuaternion = Quaternion.Identity();
    reticle.bakeCurrentTransformIntoVertices(); // bake so it lies flat by default

    const reticleMat = new StandardMaterial("reticleMat", scene);
    reticleMat.emissiveColor = new Color3(1, 1, 1);
    reticleMat.disableLighting = true;
    reticleMat.alpha = 0.45;
    reticleMat.backFaceCulling = false;
    reticle.material = reticleMat;

    // ── Load GLB ────────────────────────────────────────────────────────
    SceneLoader.ImportMeshAsync("", MODEL_URL, "", scene)
      .then((result) => {
        modelRoot = result.meshes[0];
        modelRoot.scaling = new Vector3(0.35, 0.35, 0.35);
        modelRoot.setEnabled(false);
        console.log("✅ GLB loaded, meshes:", result.meshes.length);
      })
      .catch((err) => console.error("❌ GLB load error:", err));

    // ── Lock model at a hit-test position ───────────────────────────────
    function lockModel(hitResult) {
      if (!modelRoot) {
        console.warn("⚠️ Model not loaded yet");
        return;
      }
      const pos = new Vector3();
      const rot = new Quaternion();
      hitResult.transformationMatrix.decompose(undefined, rot, pos);

      // Show every mesh in the hierarchy
      modelRoot.setEnabled(true);
      modelRoot.getChildMeshes(false).forEach((m) => (m.isVisible = true));

      // Position at the tapped floor point
      modelRoot.position.copyFrom(pos);

      // Only rotate around Y so the model stays upright
      const euler = rot.toEulerAngles();
      modelRoot.rotationQuaternion = null;
      modelRoot.rotation = new Vector3(0, euler.y, 0);

      // Freeze everything – prevents Babylon recalculating transforms every frame
      modelRoot.freezeWorldMatrix();
      modelRoot.getChildMeshes(false).forEach((m) => m.freezeWorldMatrix());

      isModelPlaced = true;
      reticle.isVisible = false;
      setSurfaceFound(false);
      console.log("✅ Model locked at", pos.toString());
    }

    // ── Reset ───────────────────────────────────────────────────────────
    window.resetAR = () => {
      if (!modelRoot) return;
      modelRoot.unfreezeWorldMatrix();
      modelRoot.getChildMeshes(false).forEach((m) => m.unfreezeWorldMatrix());
      modelRoot.setEnabled(false);
      isModelPlaced = false;
      lastHitResult = null;
      setSurfaceFound(false);
      reticle.isVisible = false;
    };

    // ── WebXR setup ─────────────────────────────────────────────────────
    scene
      .createDefaultXRExperienceAsync({
        uiOptions: {
          sessionMode: "immersive-ar",
          referenceSpaceType: "local-floor",
        },
        optionalFeatures: true,
        disableDefaultUI: true,
        disableTeleportation: true,
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
          console.warn("DOM_OVERLAY:", e);
        }

        // Hit test
        const hitTest = fm.enableFeature(WebXRFeatureName.HIT_TEST, "latest");

        // Update reticle and cache hit result every frame
        hitTest.onHitTestResultObservable.add((results) => {
          if (isModelPlaced) {
            // Model is locked – ignore all future hit tests
            reticle.isVisible = false;
            return;
          }

          if (results.length > 0) {
            lastHitResult = results[0];
            reticle.isVisible = true;
            setSurfaceFound(true);

            const pos = new Vector3();
            const rot = new Quaternion();
            results[0].transformationMatrix.decompose(undefined, rot, pos);
            reticle.position.copyFrom(pos);

            // Lay the disc flat on the surface
            const surfaceRot = rot.clone();
            reticle.rotationQuaternion.copyFrom(surfaceRot);
          } else {
            lastHitResult = null;
            reticle.isVisible = false;
            setSurfaceFound(false);
          }
        });

        // ── Attach 'select' listener when session goes IN_XR ─────────
        // We use onStateChangedObservable (NOT onXRSessionInit) because
        // the session is already initialized by the time our .then() runs.
        xr.baseExperience.onStateChangedObservable.add((state) => {
          if (state === WebXRState.IN_XR) {
            setInSession(true);

            // Attach native WebXR tap listener
            const session = xr.baseExperience.sessionManager.session;
            const onSelect = () => {
              if (isModelPlaced) return;  // already locked, ignore
              if (!lastHitResult) {
                console.warn("⚠️ Tapped but no surface detected yet");
                return;
              }
              lockModel(lastHitResult);
            };
            session.addEventListener("select", onSelect);
            selectCleanup = () => session.removeEventListener("select", onSelect);
            console.log("✅ select listener attached");
          } else {
            // Session ended or exiting
            setInSession(false);
            setSurfaceFound(false);
            isModelPlaced = false;
            lastHitResult = null;
            reticle.isVisible = false;
            if (modelRoot) {
              modelRoot.unfreezeWorldMatrix();
              modelRoot.getChildMeshes(false).forEach((m) => m.unfreezeWorldMatrix());
              modelRoot.setEnabled(false);
            }
            if (selectCleanup) {
              selectCleanup();
              selectCleanup = null;
            }
          }
        });
      })
      .catch((err) => console.error("❌ XR setup error:", err));

    // ── Render loop ─────────────────────────────────────────────────────
    engine.runRenderLoop(() => scene.render());
    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);

    return () => {
      if (selectCleanup) selectCleanup();
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

      {/* DOM Overlay */}
      <div
        ref={overlayRef}
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10 }}
      >
        {inSession && (
          <>
            <div
              style={{
                position: "absolute",
                top: 20,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.6)",
                color: "#fff",
                padding: "8px 22px",
                borderRadius: 24,
                fontSize: 14,
                fontWeight: 500,
                whiteSpace: "nowrap",
                backdropFilter: "blur(10px)",
              }}
            >
              {surfaceFound
                ? "✅ Surface found · Tap to place"
                : "🔍 Slowly move camera to scan the floor…"}
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

      {/* Landing screen */}
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
              marginBottom: 28,
              textAlign: "center",
              maxWidth: 300,
              lineHeight: 1.6,
            }}
          >
            Point your camera at a flat surface.<br />
            When the white circle appears, tap to place.
          </p>
          <button
            onClick={() => {
              if (xrHelperRef.current) {
                xrHelperRef.current.baseExperience
                  .enterXRAsync("immersive-ar", "local-floor")
                  .catch(console.error);
              } else {
                alert("AR engine is still loading, please wait a moment.");
              }
            }}
            style={{
              padding: "14px 36px",
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