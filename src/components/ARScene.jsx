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

    // ── State ───────────────────────────────────────────────────────────
    let modelRoot   = null;   // the GLTF __root__ mesh
    let anchorNode  = null;   // TransformNode that the native anchor drives
    let placedAnchor = null;  // the WebXR anchor object
    let lastHitResult = null; // most recent hit-test frame result
    let isPlaced    = false;
    let xrCamera    = null;
    let anchorSystem = null;
    let selectCleanup = null;

    // ── Reticle (visible while scanning, hidden after placement) ─────────
    const reticle = MeshBuilder.CreateDisc(
      "reticle",
      { radius: 0.28, tessellation: 48 },
      scene
    );
    reticle.rotation.x = Math.PI / 2;
    reticle.bakeCurrentTransformIntoVertices();
    reticle.isVisible = false;
    reticle.rotationQuaternion = Quaternion.Identity();

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

    // ── Show the model attached to an anchorNode ─────────────────────────
    function mountModelOnAnchor(position, yRotation) {
      if (!modelRoot) return;

      // Create a parent node that the native anchor will drive every frame
      if (!anchorNode) {
        anchorNode = new TransformNode("anchorNode", scene);
      }

      // Parent the model under the anchor node
      modelRoot.parent = anchorNode;

      // Local offset inside the anchor node: zero position, face the camera
      modelRoot.position = Vector3.Zero();
      modelRoot.rotationQuaternion = null;
      modelRoot.rotation = new Vector3(0, yRotation, 0);

      // Enable all meshes
      modelRoot.setEnabled(true);
      modelRoot.getChildMeshes(false).forEach((m) => (m.isVisible = true));

      // Place the anchor node at the hit position
      anchorNode.position.copyFrom(position);

      isPlaced = true;
      reticle.isVisible = false;
      console.log("✅ Model mounted at", position.toString());
    }

    // ── Compute the Y angle to face the camera ───────────────────────────
    function getCameraFacingY(position) {
      if (!xrCamera) return 0;
      const toCamera = xrCamera.position.subtract(position);
      return Math.atan2(toCamera.x, toCamera.z);
    }

    // ── Get placement position (hit-test or camera-ray fallback) ─────────
    function getPlacementTransform() {
      if (lastHitResult) {
        const pos = new Vector3();
        const rot = new Quaternion();
        lastHitResult.transformationMatrix.decompose(undefined, rot, pos);
        return { pos, hasHit: true };
      }
      // Fallback – project camera forward to Y=0 floor
      if (xrCamera) {
        const camPos = xrCamera.position.clone();
        const forward = xrCamera.getForwardRay().direction;
        let pos;
        if (Math.abs(forward.y) > 0.01) {
          const t = -camPos.y / forward.y;
          pos = camPos.add(forward.scale(Math.max(0.3, t)));
        } else {
          pos = camPos.add(forward.scale(1.5));
          pos.y = 0;
        }
        return { pos, hasHit: false };
      }
      return { pos: new Vector3(0, 0, -1.5), hasHit: false };
    }

    // ── Place (called on tap) ────────────────────────────────────────────
    async function handleSelect() {
      if (isPlaced || !modelRoot) return;

      const { pos, hasHit } = getPlacementTransform();
      const yRot = getCameraFacingY(pos);

      // ── Try native anchor first (zero drift) ──────────────────────────
      if (hasHit && anchorSystem) {
        try {
          const anchor = await anchorSystem.addAnchorPointUsingHitTestResultAsync(
            lastHitResult
          );
          if (anchor) {
            placedAnchor = anchor;

            // Create anchor node and let Babylon drive it every frame
            if (!anchorNode) anchorNode = new TransformNode("anchorNode", scene);
            anchor.attachedNode = anchorNode;

            // Mount model under the anchor-driven node
            modelRoot.parent = anchorNode;
            modelRoot.position = Vector3.Zero();
            modelRoot.rotationQuaternion = null;
            modelRoot.rotation = new Vector3(0, yRot, 0);
            modelRoot.setEnabled(true);
            modelRoot.getChildMeshes(false).forEach((m) => (m.isVisible = true));

            isPlaced = true;
            reticle.isVisible = false;
            console.log("⚓ Anchor placed – zero drift mode");
            return; // anchor path succeeded, done
          }
        } catch (e) {
          console.warn("⚠️ Anchor failed, falling back to direct placement:", e);
        }
      }

      // ── Fallback: direct placement (frozen in local-floor space) ──────
      mountModelOnAnchor(pos, yRot);

      // Freeze so Babylon never recalculates and the model doesn't jitter
      modelRoot.freezeWorldMatrix();
      modelRoot.getChildMeshes(false).forEach((m) => m.freezeWorldMatrix());

      console.log("📍 Direct placement (no anchor)");
    }

    // ── Reset ────────────────────────────────────────────────────────────
    window.resetAR = () => {
      if (modelRoot) {
        modelRoot.parent = null;
        try { modelRoot.unfreezeWorldMatrix(); } catch (_) {}
        modelRoot.getChildMeshes(false).forEach((m) => {
          try { m.unfreezeWorldMatrix(); } catch (_) {}
        });
        modelRoot.setEnabled(false);
      }
      if (placedAnchor) {
        try { placedAnchor.remove(); } catch (_) {}
        placedAnchor = null;
      }
      anchorNode = null;
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

        // Hit test
        const hitTest = fm.enableFeature(WebXRFeatureName.HIT_TEST, "latest");

        // Anchor system (optional – gracefully disabled if not supported)
        try {
          anchorSystem = fm.enableFeature(WebXRFeatureName.ANCHOR_SYSTEM, "latest");
          console.log("⚓ AnchorSystem enabled");
        } catch (e) {
          console.warn("⚠️ AnchorSystem not available:", e);
        }

        // Update reticle from hit-test (only while not yet placed)
        hitTest.onHitTestResultObservable.add((results) => {
          if (isPlaced) { reticle.isVisible = false; return; }
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

        // Session state
        xr.baseExperience.onStateChangedObservable.add((state) => {
          if (state === WebXRState.IN_XR) {
            setInSession(true);
            xrCamera = xr.baseExperience.camera;

            const session = xr.baseExperience.sessionManager.session;
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
          width: "100%", height: "100%", display: "block",
          position: "fixed", inset: 0, outline: "none", touchAction: "none",
        }}
      />

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
            Open the camera and tap to place your dish model.
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