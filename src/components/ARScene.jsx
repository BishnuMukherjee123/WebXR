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

    new HemisphericLight("hemi", new Vector3(0, 1, 0), scene).intensity = 1.4;
    const dir = new DirectionalLight("dir", new Vector3(-1, -2, -1), scene);
    dir.intensity = 0.9;

    // ── Mutable state ───────────────────────────────────────────────────
    let modelRoot = null;
    let lastHitResult = null;
    let isPlaced = false;
    let selectCleanup = null;
    let xrCamera = null;

    // ── Reticle ─────────────────────────────────────────────────────────
    const reticle = MeshBuilder.CreateDisc(
      "reticle",
      { radius: 0.28, tessellation: 48 },
      scene
    );
    reticle.isVisible = false;
    reticle.rotationQuaternion = Quaternion.Identity();
    // Rotate the disc to lie flat (it starts vertical by default)
    reticle.rotation.x = Math.PI / 2;
    reticle.bakeCurrentTransformIntoVertices();

    const reticleMat = new StandardMaterial("reticleMat", scene);
    reticleMat.emissiveColor = new Color3(1, 1, 1);
    reticleMat.disableLighting = true;
    reticleMat.alpha = 0.5;
    reticleMat.backFaceCulling = false;
    reticle.material = reticleMat;

    // ── Load GLB ────────────────────────────────────────────────────────
    SceneLoader.ImportMeshAsync("", MODEL_URL, "", scene)
      .then((result) => {
        modelRoot = result.meshes[0];
        modelRoot.scaling = new Vector3(3.0, 3.0, 3.0);
        modelRoot.setEnabled(false);
        console.log("✅ GLB loaded:", result.meshes.length, "meshes");
      })
      .catch((err) => console.error("❌ GLB error:", err));

    // ── Compute placement position ───────────────────────────────────────
    // If we have a hardware hit result, use it.
    // If not, project 1.5 m in front of the camera onto Y=0 (floor level in
    // local-floor reference space). This means the model ALWAYS appears on tap.
    function getPlacementTransform() {
      if (lastHitResult) {
        const pos = new Vector3();
        const rot = new Quaternion();
        lastHitResult.transformationMatrix.decompose(undefined, rot, pos);
        return { pos, rot };
      }

      // Fallback – use camera forward ray projected to floor (Y = 0)
      if (xrCamera) {
        const camPos = xrCamera.position.clone();
        const forward = xrCamera.getForwardRay().direction;

        // Solve: camPos.y + t * forward.y = 0 → t = -camPos.y / forward.y
        // If forward.y is near zero (looking straight ahead), default to 1.5m in front
        let pos;
        if (Math.abs(forward.y) > 0.01) {
          const t = -camPos.y / forward.y;
          pos = camPos.add(forward.scale(Math.max(0.3, t)));
        } else {
          pos = camPos.add(forward.scale(1.5));
          pos.y = 0;
        }

        const rot = Quaternion.Identity();
        return { pos, rot };
      }

      // Last-resort: place at world origin
      return { pos: new Vector3(0, 0, -1.5), rot: Quaternion.Identity() };
    }

    // ── Place / lock the model ────────────────────────────────────────────
    function placeModel() {
      if (!modelRoot) { console.warn("⚠️ Model not loaded yet"); return; }
      if (isPlaced) return;

      const { pos, rot } = getPlacementTransform();

      // Enable and unhide the full GLTF hierarchy
      modelRoot.setEnabled(true);
      modelRoot.getChildMeshes(false).forEach((m) => (m.isVisible = true));

      modelRoot.position.copyFrom(pos);

      // Rotate the model to face the camera (Y axis only so it stays upright).
      // This is the same "angle-changing" feature the reticle had – now applied
      // directly to the food model so it always presents its front face to the user.
      if (xrCamera) {
        const camPos = xrCamera.position.clone();
        const toCamera = camPos.subtract(pos);          // vector from model → camera
        const yAngle = Math.atan2(toCamera.x, toCamera.z); // horizontal angle only
        modelRoot.rotationQuaternion = null;
        modelRoot.rotation = new Vector3(0, yAngle, 0);
      } else {
        // Fallback – use surface normal Y rotation from hit test
        const euler = rot.toEulerAngles();
        modelRoot.rotationQuaternion = null;
        modelRoot.rotation = new Vector3(0, euler.y, 0);
      }

      // Freeze world matrix → zero CPU cost, zero drift, size never changes
      modelRoot.freezeWorldMatrix();
      modelRoot.getChildMeshes(false).forEach((m) => m.freezeWorldMatrix());

      isPlaced = true;
      reticle.isVisible = false;
      console.log("📍 Placed at", pos.toString(), "| hitTest?", !!lastHitResult);
    }

    // ── Reset ─────────────────────────────────────────────────────────────
    window.resetAR = () => {
      if (modelRoot) {
        modelRoot.unfreezeWorldMatrix();
        modelRoot.getChildMeshes(false).forEach((m) => m.unfreezeWorldMatrix());
        modelRoot.setEnabled(false);
      }
      isPlaced = false;
      lastHitResult = null;
      reticle.isVisible = false;
    };

    // ── WebXR ─────────────────────────────────────────────────────────────
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
        } catch (_) {}

        // Hit test – runs silently in the background to improve placement accuracy
        const hitTest = fm.enableFeature(WebXRFeatureName.HIT_TEST, "latest");
        hitTest.onHitTestResultObservable.add((results) => {
          if (isPlaced) {
            reticle.isVisible = false;
            return;
          }
          if (results.length > 0) {
            lastHitResult = results[0];
            reticle.isVisible = true;

            const pos = new Vector3();
            const rot = new Quaternion();
            results[0].transformationMatrix.decompose(undefined, rot, pos);
            reticle.position.copyFrom(pos);
            reticle.rotationQuaternion.copyFrom(rot);
          } else {
            lastHitResult = null;
            reticle.isVisible = false;
          }
        });

        // ── State changes ────────────────────────────────────────────────
        xr.baseExperience.onStateChangedObservable.add((state) => {
          if (state === WebXRState.IN_XR) {
            setInSession(true);

            // Cache the XR camera for fallback placement
            xrCamera = xr.baseExperience.camera;

            // Attach native select (tap) listener
            const session = xr.baseExperience.sessionManager.session;
            const onSelect = () => placeModel();
            session.addEventListener("select", onSelect);
            selectCleanup = () => session.removeEventListener("select", onSelect);
            console.log("✅ select listener ready");
          } else {
            setInSession(false);
            isPlaced = false;
            lastHitResult = null;
            xrCamera = null;
            reticle.isVisible = false;
            if (modelRoot) {
              modelRoot.unfreezeWorldMatrix();
              modelRoot.getChildMeshes(false).forEach((m) => m.unfreezeWorldMatrix());
              modelRoot.setEnabled(false);
            }
            if (selectCleanup) { selectCleanup(); selectCleanup = null; }
          }
        });
      })
      .catch((err) => console.error("❌ XR error:", err));

    // ── Render loop ────────────────────────────────────────────────────────
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
          width: "100%", height: "100%", display: "block",
          position: "fixed", inset: 0, outline: "none", touchAction: "none",
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
              position: "absolute", top: 20, left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.6)", color: "#fff",
              padding: "8px 22px", borderRadius: 24,
              fontSize: 14, fontWeight: 500,
              whiteSpace: "nowrap", backdropFilter: "blur(10px)",
            }}>
              Tap anywhere to place
            </div>
            <button
              onClick={() => window.resetAR?.()}
              style={{
                position: "absolute", top: 16, right: 16,
                pointerEvents: "auto", padding: "8px 18px",
                background: "rgba(30,30,30,0.85)", color: "#fff",
                border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: "pointer", backdropFilter: "blur(4px)",
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
          alignItems: "center", justifyContent: "center", zIndex: 20,
        }}>
          <h1 style={{ color: "#fff", fontSize: 24, marginBottom: 12 }}>Aroma WebXR</h1>
          <p style={{
            color: "#aaa", fontSize: 14, marginBottom: 28,
            textAlign: "center", maxWidth: 300, lineHeight: 1.6,
          }}>
            Open the camera, then tap anywhere to instantly place your model.
          </p>
          <button
            onClick={() => {
              if (xrHelperRef.current) {
                xrHelperRef.current.baseExperience
                  .enterXRAsync("immersive-ar", "local-floor")
                  .catch(console.error);
              } else {
                alert("AR engine loading, please wait.");
              }
            }}
            style={{
              padding: "14px 36px", background: "#fff", color: "#000",
              border: "none", borderRadius: 12, fontSize: 16,
              fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 20px rgba(255,255,255,0.25)",
            }}
          >
            Launch AR
          </button>
        </div>
      )}
    </>
  );
}