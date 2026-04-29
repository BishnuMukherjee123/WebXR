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

// ─── Tuning ───────────────────────────────────────────────────────────────────
const MODEL_SCALE         = 3.0;   // world-space metres
const RETICLE_LERP        = 0.12;  // smoothing factor per frame (0=frozen, 1=instant)
const STABLE_FRAMES_REQ   = 8;     // consecutive hit results required before showing reticle
const MIN_PLACE_DIST      = 0.45;  // metres – reject hit-tests closer than this (ARCore unstable zone)

/**
 * useAREngine – all Babylon.js + WebXR logic.
 *
 * Research basis:
 *  • Babylon.js official AR docs (hit-test, anchor system, reference spaces)
 *  • Taikonauten WebXR/Babylon.js series (Parts 4 & 7) – real-world patterns
 *  • Babylon.js forum: RaananW + docEdub confirm:
 *      - <30–40 cm hits are inherently unstable (ARCore hardware limit)
 *      - Use addAnchorAtPositionAndRotationAsync().then(a => a.attachedNode = node)
 *      - XRAnchor available on all AR-enabled Android Chrome/Edge without flags
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

    // ── Engine ──────────────────────────────────────────────────────────────
    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      adaptToDeviceRatio: true,
    });
    const scene = new Scene(engine);
    scene.clearColor       = new Color4(0, 0, 0, 0);
    scene.autoClear        = false;              // AR pass-through: don't overdraw
    scene.skipPointerMovePicking = true;         // no mesh picking on every pointer move

    // Lighting
    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 1.3;
    const dir = new DirectionalLight("dir", new Vector3(-1, -2, -1), scene);
    dir.intensity = 0.8;

    // ── Mutable session state (never stored in React state – avoids re-renders) ──
    let modelRoot     = null;   // GLTF AbstractMesh root
    let modelYOffset  = 0;      // computed floor-lift
    let anchorNode    = null;   // TransformNode the anchor drives
    let placedAnchor  = null;   // IWebXRAnchor keeping model world-locked
    let lastHitResult = null;   // most recent IWebXRHitTestResult
    let isPlaced      = false;
    let anchorSystem  = null;
    let xrCamera      = null;
    let selectCleanup = null;
    let stableCount   = 0;      // consecutive valid hit frames

    // Pre-allocated temporaries – ZERO allocations inside render loop
    const _lerpPos = new Vector3();
    const _lerpRot = Quaternion.Identity();

    // ── Reticle ─────────────────────────────────────────────────────────────
    const reticle = MeshBuilder.CreateTorus(
      "reticle",
      { diameter: 0.5, thickness: 0.018, tessellation: 48 },
      scene
    );
    reticle.rotationQuaternion = Quaternion.Identity();
    reticle.isVisible = false;

    const reticleMat = new StandardMaterial("reticleMat", scene);
    reticleMat.emissiveColor   = new Color3(1, 1, 1);
    reticleMat.disableLighting = true;
    reticleMat.alpha           = 0.7;
    reticleMat.backFaceCulling = false;
    reticle.material           = reticleMat;

    // Smooth reticle each frame using pre-allocated vectors (no GC)
    scene.registerBeforeRender(() => {
      if (isPlaced || !lastHitResult) return;
      lastHitResult.transformationMatrix.decompose(undefined, _lerpRot, _lerpPos);
      Vector3.LerpToRef(reticle.position,          _lerpPos, RETICLE_LERP, reticle.position);
      Quaternion.SlerpToRef(reticle.rotationQuaternion, _lerpRot, RETICLE_LERP, reticle.rotationQuaternion);
    });

    // ── GLB load ─────────────────────────────────────────────────────────────
    SceneLoader.ImportMeshAsync("", MODEL_URL, "", scene)
      .then((result) => {
        modelRoot = result.meshes[0];
        modelRoot.scaling = new Vector3(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);

        // Force world-matrix computation to get accurate bounding box
        scene.meshes.forEach((m) => m.computeWorldMatrix(true));
        const bounds = modelRoot.getHierarchyBoundingVectors(true);
        modelYOffset = -bounds.min.y;   // lift base to floor (Y=0)

        modelRoot.setEnabled(false);
        console.log("✅ GLB ready | floorOffset =", modelYOffset.toFixed(3));
      })
      .catch((err) => console.error("❌ GLB error:", err));

    // ── Helpers ───────────────────────────────────────────────────────────────

    function showModel() {
      modelRoot.setEnabled(true);
      modelRoot.getChildMeshes(false).forEach((m) => (m.isVisible = true));
    }

    // Floor-aligned pose per spec: rotation.x=0, rotation.z=0
    function applyModelPose(yRotation) {
      modelRoot.position           = new Vector3(0, modelYOffset, 0);
      modelRoot.rotationQuaternion = null;
      modelRoot.rotation           = new Vector3(0, yRotation, 0);
    }

    // Extract world position + Y rotation from hit-test matrix
    function decomposeHitResult(hitResult) {
      const pos = new Vector3();
      const rot = new Quaternion();
      hitResult.transformationMatrix.decompose(undefined, rot, pos);
      return { pos, yRot: rot.toEulerAngles().y };
    }

    // ── Distance guard ────────────────────────────────────────────────────────
    // Forum confirmed: hits <30-40cm from camera are in ARCore's unstable zone.
    // Reject them to prevent "wandering" anchors.
    function isTooCloseToCamera(pos) {
      if (!xrCamera) return false;
      return Vector3.Distance(xrCamera.position, pos) < MIN_PLACE_DIST;
    }

    // ── Anchor placement (docs + forum pattern) ───────────────────────────────
    // Pattern from Part 7 + RaananW confirmation:
    //   addAnchorAtPositionAndRotationAsync(pos, rot)
    //     .then(anchor => { anchor.attachedNode = transformNode })
    async function placeWithAnchor(pos, rotQuat, yRot) {
      // anchorNode acts as the stable world-locked parent
      if (!anchorNode) anchorNode = new TransformNode("anchorNode", scene);
      anchorNode.position.copyFrom(pos);

      // Parent model under anchor node BEFORE async call
      modelRoot.parent = anchorNode;
      applyModelPose(yRot);
      showModel();

      try {
        const anchor = await anchorSystem.addAnchorAtPositionAndRotationAsync(pos, rotQuat);
        if (anchor) {
          placedAnchor = anchor;
          // Babylon updates anchorNode's transform every XR frame from the native anchor
          anchor.attachedNode = anchorNode;
          console.log("⚓ Anchor attached – world-locked");
        }
      } catch (e) {
        console.warn("⚠️ Anchor creation failed (device may not support it):", e.message ?? e);
        // Model already shown – just stays at direct position without world-lock
      }

      isPlaced = true;
      reticle.isVisible = false;
      setSurfaceReady(false);
    }

    // ── Direct fallback (no anchor system) ────────────────────────────────────
    function placeDirectly(pos, yRot) {
      if (!anchorNode) anchorNode = new TransformNode("anchorNode", scene);
      anchorNode.parent = null;
      anchorNode.position.copyFrom(pos);
      anchorNode.rotation = Vector3.Zero();

      modelRoot.parent = anchorNode;
      applyModelPose(yRot);
      showModel();

      isPlaced = true;
      reticle.isVisible = false;
      setSurfaceReady(false);
      console.log("📍 Direct placement (anchor system unavailable)");
    }

    // ── Tap handler ───────────────────────────────────────────────────────────
    async function handleSelect() {
      if (isPlaced || !modelRoot || !lastHitResult) return;

      const { pos, yRot } = decomposeHitResult(lastHitResult);

      // Reject unstable close-range hits (ARCore <30-40cm zone)
      if (isTooCloseToCamera(pos)) {
        console.warn("⚠️ Hit too close to camera, ignoring");
        return;
      }

      const rot = Quaternion.Identity();
      lastHitResult.transformationMatrix.decompose(undefined, rot, undefined);

      if (anchorSystem) {
        await placeWithAnchor(pos, rot, yRot);
      } else {
        placeDirectly(pos, yRot);
      }
    }

    // ── Reset ──────────────────────────────────────────────────────────────────
    window.resetAR = () => {
      if (modelRoot) { modelRoot.parent = null; modelRoot.setEnabled(false); }
      if (placedAnchor) { try { placedAnchor.remove(); } catch (_) {} placedAnchor = null; }
      anchorNode    = null;
      isPlaced      = false;
      lastHitResult = null;
      stableCount   = 0;
      reticle.isVisible = false;
      setSurfaceReady(false);
    };

    // ── WebXR setup ────────────────────────────────────────────────────────────
    scene.createDefaultXRExperienceAsync({
      uiOptions: {
        sessionMode: "immersive-ar",
        referenceSpaceType: "local-floor",  // Y=0 = detected floor level
      },
      // Explicit feature list is more reliable than optionalFeatures: true
      optionalFeatures: ["hit-test", "anchors", "dom-overlay"],
      disableDefaultUI: true,
      disableTeleportation: true,
    }).then((xr) => {
      xrHelperRef.current = xr;
      const fm = xr.baseExperience.featuresManager;

      // DOM overlay (optional – AR-specific UI layer)
      try {
        fm.enableFeature(WebXRFeatureName.DOM_OVERLAY, "latest", {
          element: overlayRef.current,
        });
      } catch (_) {}

      // ── Hit-test ─────────────────────────────────────────────────────────
      // Babylon creates the XRHitTestSource once internally and reuses it.
      const hitTest = fm.enableFeature(WebXRFeatureName.HIT_TEST, "latest");

      hitTest.onHitTestResultObservable.add((results) => {
        if (isPlaced) return;

        if (results.length > 0) {
          // Stability filter: require STABLE_FRAMES_REQ consecutive frames
          stableCount = Math.min(stableCount + 1, STABLE_FRAMES_REQ + 1);
          lastHitResult = results[0];

          if (stableCount >= STABLE_FRAMES_REQ) {
            reticle.isVisible = true;
            setSurfaceReady(true);
          }
        } else {
          // Surface lost – reset counter fully so we re-validate stability
          stableCount   = 0;
          lastHitResult = null;
          reticle.isVisible = false;
          setSurfaceReady(false);
        }
      });

      // ── Anchor system ─────────────────────────────────────────────────────
      // Available on all AR-enabled Android Chrome without flags (confirmed: RaananW)
      try {
        anchorSystem = fm.enableFeature(WebXRFeatureName.ANCHOR_SYSTEM, "latest");
        console.log("⚓ AnchorSystem ready");
      } catch (e) {
        console.warn("⚠️ AnchorSystem unavailable:", e.message ?? e);
      }

      // ── Session lifecycle ─────────────────────────────────────────────────
      xr.baseExperience.onStateChangedObservable.add((state) => {
        if (state === WebXRState.IN_XR) {
          setInSession(true);
          xrCamera = xr.baseExperience.camera;

          // Native 'select' event – the only reliable tap source in immersive-ar
          const session  = xr.baseExperience.sessionManager.session;
          const onSelect = () => handleSelect();
          session.addEventListener("select", onSelect);
          selectCleanup = () => session.removeEventListener("select", onSelect);
          console.log("✅ AR session active");
        } else {
          setInSession(false);
          xrCamera = null;
          window.resetAR();
          if (selectCleanup) { selectCleanup(); selectCleanup = null; }
        }
      });
    }).catch((err) => console.error("❌ XR init error:", err));

    // ── Render loop ────────────────────────────────────────────────────────────
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
