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
  TransformNode,
  MeshBuilder,
  StandardMaterial,
  Color3,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";

const MODEL_URL =
  "https://iskchovltfnohyftjckg.supabase.co/storage/v1/object/public/models/10.glb";

// How fast the reticle smoothly tracks the detected surface (0–1, lower = smoother)
const RETICLE_LERP = 0.12;

export default function ARScene() {
  const canvasRef  = useRef(null);
  const overlayRef = useRef(null);
  const [inSession, setInSession]       = useState(false);
  const [surfaceReady, setSurfaceReady] = useState(false);
  const xrHelperRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Engine ───────────────────────────────────────────────────────────
    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 0);

    // Lighting
    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 1.3;
    const dir = new DirectionalLight("dir", new Vector3(-1, -2, -1), scene);
    dir.intensity = 0.8;

    // ── Shared mutable state ─────────────────────────────────────────────
    let modelRoot       = null;   // GLTF __root__ mesh node
    let modelYOffset    = 0;      // lift so model base touches the floor
    let anchorNode      = null;   // TransformNode driven by native anchor
    let placedAnchor    = null;   // WebXR anchor object
    let lastHitResult   = null;   // most recent hit-test result
    let isPlaced        = false;
    let anchorSystem    = null;
    let xrCamera        = null;
    let selectCleanup   = null;

    // Smooth reticle target (lerped toward in render loop)
    const reticleTarget = {
      pos: new Vector3(),
      rot: Quaternion.Identity(),
      valid: false,
    };

    // ── Reticle ─────────────────────────────────────────────────────────
    // Flat ring lying on the detected surface
    const reticle = MeshBuilder.CreateTorus(
      "reticle",
      { diameter: 0.5, thickness: 0.02, tessellation: 48 },
      scene
    );
    reticle.rotationQuaternion = Quaternion.Identity();
    reticle.isVisible = false;

    const reticleMat = new StandardMaterial("reticleMat", scene);
    reticleMat.emissiveColor = new Color3(1, 1, 1);
    reticleMat.disableLighting = true;
    reticleMat.alpha = 0.65;
    reticle.material = reticleMat;

    // Lerp the reticle toward the latest hit-test position every frame
    scene.registerBeforeRender(() => {
      if (isPlaced || !reticleTarget.valid) return;
      reticle.position = Vector3.Lerp(reticle.position, reticleTarget.pos, RETICLE_LERP);
      Quaternion.SlerpToRef(
        reticle.rotationQuaternion,
        reticleTarget.rot,
        RETICLE_LERP,
        reticle.rotationQuaternion
      );
    });

    // ── Load GLB ────────────────────────────────────────────────────────
    SceneLoader.ImportMeshAsync("", MODEL_URL, "", scene)
      .then((result) => {
        modelRoot = result.meshes[0];
        modelRoot.scaling = new Vector3(3.0, 3.0, 3.0);

        // Force bounding-box computation while the mesh is visible
        scene.meshes.forEach((m) => m.computeWorldMatrix(true));

        // Calculate the Y offset needed to lift the base to Y = 0 (floor)
        const bounds = modelRoot.getHierarchyBoundingVectors(true);
        // bounds are in local space; the lowest point (min.y) should reach 0
        modelYOffset = -bounds.min.y;
        console.log(
          "✅ GLB loaded | bounds min.y =",
          bounds.min.y.toFixed(3),
          "| floorOffset =",
          modelYOffset.toFixed(3)
        );

        modelRoot.setEnabled(false);
      })
      .catch((err) => console.error("❌ GLB error:", err));

    // ── Unhide entire GLTF hierarchy ─────────────────────────────────────
    function showModel() {
      modelRoot.setEnabled(true);
      modelRoot.getChildMeshes(false).forEach((m) => (m.isVisible = true));
    }

    // ── Apply floor-aligned pose to the model ────────────────────────────
    //  - position  : world position from hit test
    //  - yRotation : Y-axis rotation only (from surface normal decompose)
    //
    // Per spec: rotation.x = 0, rotation.z = 0
    // No billboard / camera-facing applied here.
    function applyPose(position, yRotation) {
      modelRoot.position = new Vector3(0, modelYOffset, 0); // sit ON the floor
      modelRoot.rotationQuaternion = null;
      modelRoot.rotation = new Vector3(0, yRotation, 0);    // upright, floor-aligned
    }

    // ── Place via native WebXR anchor (zero drift) ───────────────────────
    async function placeWithAnchor(hitResult, yRotation) {
      const anchor = await anchorSystem.addAnchorPointUsingHitTestResultAsync(hitResult);
      if (!anchor) return false;

      placedAnchor = anchor;

      if (!anchorNode) anchorNode = new TransformNode("anchorNode", scene);
      // Babylon updates anchorNode's world matrix every frame from the anchor
      anchor.attachedNode = anchorNode;

      modelRoot.parent = anchorNode;
      applyPose(Vector3.Zero(), yRotation);
      showModel();

      isPlaced = true;
      reticle.isVisible = false;
      setSurfaceReady(false);
      console.log("⚓ Placed via native anchor (zero drift)");
      return true;
    }

    // ── Place directly at world position (fallback) ───────────────────────
    function placeDirectly(position, yRotation) {
      if (!anchorNode) anchorNode = new TransformNode("anchorNode", scene);
      anchorNode.parent = null;
      anchorNode.position.copyFrom(position);
      anchorNode.rotationQuaternion = null;
      anchorNode.rotation = Vector3.Zero();

      modelRoot.parent = anchorNode;
      applyPose(position, yRotation);
      showModel();

      isPlaced = true;
      reticle.isVisible = false;
      setSurfaceReady(false);
      console.log("📍 Placed directly (no anchor)");
    }

    // ── Main tap handler ─────────────────────────────────────────────────
    async function handleSelect() {
      if (isPlaced || !modelRoot) return;

      // Require an actual hit result – no floating placement in mid-air
      if (!lastHitResult) {
        console.warn("⚠️ No surface detected yet – keep pointing at the floor");
        return;
      }

      // Decompose the hit-test matrix into position + rotation
      const pos = new Vector3();
      const rot = new Quaternion();
      lastHitResult.transformationMatrix.decompose(undefined, rot, pos);

      // Extract only the Y-axis rotation (keeps model upright on floor)
      const euler = rot.toEulerAngles();
      const yRot  = euler.y;

      // Try anchor path first
      if (anchorSystem) {
        try {
          const ok = await placeWithAnchor(lastHitResult, yRot);
          if (ok) return;
        } catch (e) {
          console.warn("⚠️ Anchor failed, falling back:", e.message);
        }
      }

      // Anchor unavailable or failed → place directly
      placeDirectly(pos, yRot);
    }

    // ── Reset ─────────────────────────────────────────────────────────────
    window.resetAR = () => {
      if (modelRoot) {
        modelRoot.parent = null;
        modelRoot.setEnabled(false);
      }
      if (placedAnchor) {
        try { placedAnchor.remove(); } catch (_) {}
        placedAnchor = null;
      }
      anchorNode = null;
      isPlaced   = false;
      lastHitResult     = null;
      reticleTarget.valid = false;
      reticle.isVisible = false;
      setSurfaceReady(false);
    };

    // ── WebXR ─────────────────────────────────────────────────────────────
    scene
      .createDefaultXRExperienceAsync({
        uiOptions: {
          sessionMode: "immersive-ar",
          referenceSpaceType: "local-floor",   // Y=0 is the physical floor
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

        // ── Hit test ─────────────────────────────────────────────────────
        const hitTest = fm.enableFeature(WebXRFeatureName.HIT_TEST, "latest");

        hitTest.onHitTestResultObservable.add((results) => {
          if (isPlaced) return;

          if (results.length > 0) {
            lastHitResult = results[0];

            const pos = new Vector3();
            const rot = new Quaternion();
            results[0].transformationMatrix.decompose(undefined, rot, pos);

            // Store target; lerp runs in registerBeforeRender
            reticleTarget.pos.copyFrom(pos);
            reticleTarget.rot.copyFrom(rot);
            reticleTarget.valid = true;
            reticle.isVisible = true;
            setSurfaceReady(true);
          } else {
            lastHitResult = null;
            reticleTarget.valid = false;
            reticle.isVisible = false;
            setSurfaceReady(false);
          }
        });

        // ── Anchor system (optional) ──────────────────────────────────────
        try {
          anchorSystem = fm.enableFeature(WebXRFeatureName.ANCHOR_SYSTEM, "latest");
          console.log("⚓ AnchorSystem enabled");
        } catch (e) {
          console.warn("⚠️ AnchorSystem not supported:", e.message);
        }

        // ── Session state ─────────────────────────────────────────────────
        xr.baseExperience.onStateChangedObservable.add((state) => {
          if (state === WebXRState.IN_XR) {
            setInSession(true);
            xrCamera = xr.baseExperience.camera;

            // Attach native WebXR tap listener
            const session  = xr.baseExperience.sessionManager.session;
            const onSelect = () => handleSelect();
            session.addEventListener("select", onSelect);
            selectCleanup = () => session.removeEventListener("select", onSelect);
            console.log("✅ XR session ready");
          } else {
            setInSession(false);
            xrCamera = null;
            window.resetAR();
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
          width: "100%", height: "100%",
          display: "block", position: "fixed",
          inset: 0, outline: "none", touchAction: "none",
        }}
      />

      {/* DOM overlay – visible inside AR session */}
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
              {surfaceReady
                ? "Surface detected · Tap to place"
                : "Slowly scan the floor…"}
            </div>
            <button
              onClick={() => window.resetAR?.()}
              style={{
                position: "absolute", top: 16, right: 16,
                pointerEvents: "auto", padding: "8px 18px",
                background: "rgba(20,20,20,0.85)", color: "#fff",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: "pointer", backdropFilter: "blur(6px)",
              }}
            >
              Reset
            </button>
          </>
        )}
      </div>

      {/* Landing screen */}
      {!inSession && (
        <div style={{
          position: "fixed", inset: 0,
          background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", zIndex: 20,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
            border: "1.5px solid rgba(255,255,255,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, marginBottom: 24,
          }}>🍽️</div>
          <h1 style={{
            color: "#fff", fontSize: 26, fontWeight: 700,
            marginBottom: 10, letterSpacing: -0.5,
          }}>Aroma AR</h1>
          <p style={{
            color: "rgba(255,255,255,0.5)", fontSize: 14,
            marginBottom: 36, textAlign: "center",
            maxWidth: 280, lineHeight: 1.7,
          }}>
            Point your camera at the floor.<br />
            When the ring appears, tap to place.
          </p>
          <button
            onClick={() => {
              if (xrHelperRef.current) {
                xrHelperRef.current.baseExperience
                  .enterXRAsync("immersive-ar", "local-floor")
                  .catch(console.error);
              } else {
                alert("AR engine loading — please wait a moment.");
              }
            }}
            style={{
              padding: "15px 40px",
              background: "#fff", color: "#000",
              border: "none", borderRadius: 50,
              fontSize: 15, fontWeight: 700,
              cursor: "pointer", letterSpacing: 0.3,
              boxShadow: "0 8px 32px rgba(255,255,255,0.2)",
            }}
          >
            Launch AR
          </button>
        </div>
      )}
    </>
  );
}