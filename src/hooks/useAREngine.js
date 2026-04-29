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

// ── Tuning constants ──────────────────────────────────────────────────────────
const LERP_FACTOR         = 0.12;  // reticle smoothing (0 = frozen, 1 = instant)
const STABLE_FRAME_NEEDED = 8;     // consecutive hit-test frames required before showing reticle
const MODEL_SCALE         = 3.0;   // world-space metres

/**
 * useAREngine
 * All Babylon.js + WebXR logic in one place.
 * Returns refs the host component attaches to the DOM, and reactive UI state.
 */
export function useAREngine() {
  const canvasRef   = useRef(null);
  const overlayRef  = useRef(null);
  const xrHelperRef = useRef(null);

  const [inSession,    setInSession]    = useState(false);
  const [surfaceReady, setSurfaceReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Engine / Scene ──────────────────────────────────────────────────────
    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      // Limit to 60 fps to save battery and reduce jitter on mobile
      adaptToDeviceRatio: true,
    });
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 0);
    // Reduce unnecessary mesh computations
    scene.skipPointerMovePicking = true;
    scene.autoClear = false;   // AR pass-through: don't clear to background colour

    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 1.3;
    const dir = new DirectionalLight("dir", new Vector3(-1, -2, -1), scene);
    dir.intensity = 0.8;

    // ── Mutable state (no React state updates inside render loop) ───────────
    let modelRoot     = null;   // GLTF root AbstractMesh
    let modelYOffset  = 0;      // lift model so its base is at Y=0
    let anchorNode    = null;   // TransformNode driven by the native anchor
    let placedAnchor  = null;   // IWebXRAnchor currently holding the model
    let lastHitResult = null;   // most recent IWebXRHitTestResult
    let isPlaced      = false;
    let anchorSystem  = null;
    let selectCleanup = null;

    // Stability filter – require N consecutive frames before showing reticle
    let stableFrameCount = 0;

    // Pre-allocated temporaries for the lerp loop (zero GC pressure)
    const _tmpPos = new Vector3();
    const _tmpRot = Quaternion.Identity();

    // ── Reticle ─────────────────────────────────────────────────────────────
    const reticle = MeshBuilder.CreateTorus(
      "reticle",
      { diameter: 0.5, thickness: 0.018, tessellation: 48 },
      scene
    );
    reticle.rotationQuaternion = Quaternion.Identity();
    reticle.isVisible = false;
    // Use a separate scaling vector so we never overwrite it during decompose
    reticle.scaling = Vector3.One();

    const reticleMat = new StandardMaterial("reticleMat", scene);
    reticleMat.emissiveColor   = new Color3(1, 1, 1);
    reticleMat.disableLighting = true;
    reticleMat.alpha           = 0.7;
    reticle.material           = reticleMat;

    // Smooth-lerp the reticle every frame using pre-allocated temp vectors
    scene.registerBeforeRender(() => {
      if (isPlaced || !lastHitResult) return;

      // Decompose directly into pre-allocated temporaries (no new() calls)
      lastHitResult.transformationMatrix.decompose(undefined, _tmpRot, _tmpPos);

      // Lerp position
      Vector3.LerpToRef(reticle.position, _tmpPos, LERP_FACTOR, reticle.position);
      // Slerp rotation
      Quaternion.SlerpToRef(reticle.rotationQuaternion, _tmpRot, LERP_FACTOR, reticle.rotationQuaternion);
    });

    // ── GLB load ────────────────────────────────────────────────────────────
    SceneLoader.ImportMeshAsync("", MODEL_URL, "", scene)
      .then((result) => {
        modelRoot = result.meshes[0];
        modelRoot.scaling = new Vector3(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);

        // Compute bounding box while mesh is live to find the floor offset
        scene.meshes.forEach((m) => m.computeWorldMatrix(true));
        const bounds = modelRoot.getHierarchyBoundingVectors(true);
        // Lift model so bottom of bounding box aligns with Y=0 (floor)
        modelYOffset = -bounds.min.y;

        // Start hidden
        modelRoot.setEnabled(false);
        console.log("✅ GLB ready | floorOffset =", modelYOffset.toFixed(3));
      })
      .catch((err) => console.error("❌ GLB error:", err));

    // ── Helpers ─────────────────────────────────────────────────────────────

    // Show every mesh in the GLTF hierarchy
    function showModel() {
      modelRoot.setEnabled(true);
      modelRoot.getChildMeshes(false).forEach((m) => (m.isVisible = true));
    }

    // Floor-aligned pose: rotation.x = 0, rotation.z = 0 as per spec
    function applyModelPose(yRotation) {
      modelRoot.position         = new Vector3(0, modelYOffset, 0);
      modelRoot.rotationQuaternion = null;
      modelRoot.rotation           = new Vector3(0, yRotation, 0);
    }

    // Extract Y-axis rotation from a hit-test matrix
    function yRotFromHitResult(hitResult) {
      const rot = Quaternion.Identity();
      hitResult.transformationMatrix.decompose(undefined, rot, undefined);
      return rot.toEulerAngles().y;
    }

    // ── Anchor path (docs-compliant) ─────────────────────────────────────────
    // Per Babylon docs: use onAnchorAddedObservable to attach the node,
    // NOT the promise return value of addAnchorPointUsingHitTestResultAsync.
    function setupAnchorObservable(anchorSys, yRotation) {
      const sub = anchorSys.onAnchorAddedObservable.addOnce((anchor) => {
        if (!anchorNode) anchorNode = new TransformNode("anchorNode", scene);
        // Babylon updates anchorNode's world matrix every XR frame from the anchor
        anchor.attachedNode = anchorNode;
        placedAnchor = anchor;

        // Parent model under the anchor-driven node
        modelRoot.parent = anchorNode;
        applyModelPose(yRotation);
        showModel();

        isPlaced = true;
        reticle.isVisible = false;
        setSurfaceReady(false);
        console.log("⚓ Anchor attached – zero drift");
      });
      return sub; // caller can dispose if needed
    }

    // ── Direct placement fallback ────────────────────────────────────────────
    function placeDirectly(pos, yRotation) {
      if (!anchorNode) anchorNode = new TransformNode("anchorNode", scene);
      anchorNode.parent = null;
      anchorNode.position.copyFrom(pos);
      anchorNode.rotationQuaternion = null;
      anchorNode.rotation = Vector3.Zero();

      modelRoot.parent = anchorNode;
      applyModelPose(yRotation);
      showModel();

      isPlaced = true;
      reticle.isVisible = false;
      setSurfaceReady(false);
      console.log("📍 Direct placement (no anchor)");
    }

    // ── Tap handler ──────────────────────────────────────────────────────────
    async function handleSelect() {
      if (isPlaced || !modelRoot || !lastHitResult) return;

      const yRot = yRotFromHitResult(lastHitResult);

      if (anchorSystem) {
        try {
          // Register observer BEFORE calling addAnchor so we never miss the event
          setupAnchorObservable(anchorSystem, yRot);
          await anchorSystem.addAnchorPointUsingHitTestResultAsync(lastHitResult);
          // If the observable fires, we're done.  If it never fires (device
          // doesn't support it), placeDirectly below will be unreachable because
          // isPlaced will have been set inside the observable.
          return;
        } catch (e) {
          // Anchor not supported → fall through to direct placement
          console.warn("⚠️ Anchor failed:", e.message ?? e);
        }
      }

      // Decompose once for the fallback
      const pos = new Vector3();
      lastHitResult.transformationMatrix.decompose(undefined, undefined, pos);
      placeDirectly(pos, yRot);
    }

    // ── Reset ────────────────────────────────────────────────────────────────
    window.resetAR = () => {
      if (modelRoot) {
        modelRoot.parent = null;
        modelRoot.setEnabled(false);
      }
      if (placedAnchor) {
        try { placedAnchor.remove(); } catch (_) {}
        placedAnchor = null;
      }
      anchorNode        = null;
      isPlaced          = false;
      lastHitResult     = null;
      stableFrameCount  = 0;
      reticle.isVisible = false;
      setSurfaceReady(false);
    };

    // ── WebXR setup ──────────────────────────────────────────────────────────
    scene.createDefaultXRExperienceAsync({
      uiOptions: {
        sessionMode: "immersive-ar",
        // local-floor: Y=0 is the physical detected floor level
        referenceSpaceType: "local-floor",
      },
      // Request specific features explicitly (more reliable than optionalFeatures: true)
      optionalFeatures: ["hit-test", "anchors", "dom-overlay"],
      disableDefaultUI: true,
      disableTeleportation: true,
    }).then((xr) => {
      xrHelperRef.current = xr;
      const fm = xr.baseExperience.featuresManager;

      // DOM overlay
      try {
        fm.enableFeature(WebXRFeatureName.DOM_OVERLAY, "latest", {
          element: overlayRef.current,
        });
      } catch (_) { /* optional */ }

      // ── Hit test ───────────────────────────────────────────────────────────
      // Babylon creates the hit-test source once and caches it internally –
      // no need to manage the XRHitTestSource lifecycle manually.
      const hitTest = fm.enableFeature(WebXRFeatureName.HIT_TEST, "latest");

      hitTest.onHitTestResultObservable.add((results) => {
        if (isPlaced) return;

        if (results.length > 0) {
          // Stability filter: require N consecutive frames with a result
          stableFrameCount = Math.min(stableFrameCount + 1, STABLE_FRAME_NEEDED + 1);
          lastHitResult = results[0];

          if (stableFrameCount >= STABLE_FRAME_NEEDED) {
            reticle.isVisible = true;
            setSurfaceReady(true);
          }
        } else {
          // Lost surface → reset counter, hide reticle
          stableFrameCount = 0;
          lastHitResult    = null;
          reticle.isVisible = false;
          setSurfaceReady(false);
        }
      });

      // ── Anchor system (optional) ───────────────────────────────────────────
      try {
        anchorSystem = fm.enableFeature(WebXRFeatureName.ANCHOR_SYSTEM, "latest");
        console.log("⚓ AnchorSystem ready");
      } catch (e) {
        console.warn("⚠️ AnchorSystem not available:", e.message ?? e);
      }

      // ── XR session state ───────────────────────────────────────────────────
      xr.baseExperience.onStateChangedObservable.add((state) => {
        if (state === WebXRState.IN_XR) {
          setInSession(true);

          // Attach native 'select' listener (the only reliable tap event in AR)
          const session  = xr.baseExperience.sessionManager.session;
          const onSelect = () => handleSelect();
          session.addEventListener("select", onSelect);
          selectCleanup = () => session.removeEventListener("select", onSelect);
          console.log("✅ XR session active");
        } else {
          setInSession(false);
          window.resetAR();
          if (selectCleanup) { selectCleanup(); selectCleanup = null; }
        }
      });
    }).catch((err) => console.error("❌ XR error:", err));

    // ── Render loop ──────────────────────────────────────────────────────────
    engine.runRenderLoop(() => scene.render());
    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);

    return () => {
      if (selectCleanup) selectCleanup();
      window.removeEventListener("resize", onResize);
      engine.dispose();
    };
  }, []);

  return { canvasRef, overlayRef, xrHelperRef, inSession, surfaceReady };
}
