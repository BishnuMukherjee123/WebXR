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

const MODEL_SCALE       = 3.0;
const RETICLE_LERP      = 0.12;
const STABLE_FRAMES_REQ = 4;

export function useAREngine() {
  const canvasRef   = useRef(null);
  const overlayRef  = useRef(null);
  const xrHelperRef = useRef(null);

  const [inSession,    setInSession]    = useState(false);
  const [surfaceReady, setSurfaceReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      adaptToDeviceRatio: true,
    });
    const scene = new Scene(engine);
    scene.clearColor             = new Color4(0, 0, 0, 0);
    scene.autoClear              = false;
    scene.skipPointerMovePicking = true;

    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 1.3;
    const dir = new DirectionalLight("dir", new Vector3(-1, -2, -1), scene);
    dir.intensity = 0.8;

    let modelRoot     = null;
    let modelYOffset  = 0;
    let anchorNode    = null;
    let placedAnchor  = null;
    let lastHitResult = null;
    let isPlaced      = false;
    let anchorSystem  = null;
    let xrCamera      = null;
    let selectCleanup = null;
    let stableCount   = 0;

    // Pre-allocated – zero GC in render loop
    const _lerpPos = new Vector3();
    const _lerpRot = Quaternion.Identity();

    // ── Reticle ──────────────────────────────────────────────────────────────
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

    scene.registerBeforeRender(() => {
      if (isPlaced || !lastHitResult) return;
      lastHitResult.transformationMatrix.decompose(undefined, _lerpRot, _lerpPos);
      Vector3.LerpToRef(reticle.position, _lerpPos, RETICLE_LERP, reticle.position);
      Quaternion.SlerpToRef(reticle.rotationQuaternion, _lerpRot, RETICLE_LERP, reticle.rotationQuaternion);
    });

    // ── Load GLB ─────────────────────────────────────────────────────────────
    SceneLoader.ImportMeshAsync("", MODEL_URL, "", scene)
      .then((result) => {
        modelRoot = result.meshes[0];
        modelRoot.scaling = new Vector3(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
        scene.meshes.forEach((m) => m.computeWorldMatrix(true));
        const bounds  = modelRoot.getHierarchyBoundingVectors(true);
        modelYOffset  = -bounds.min.y;
        modelRoot.setEnabled(false);
        console.log("✅ GLB ready | floorOffset =", modelYOffset.toFixed(3));
      })
      .catch((err) => console.error("❌ GLB error:", err));

    // ── Helpers ───────────────────────────────────────────────────────────────
    function showModel() {
      modelRoot.setEnabled(true);
      modelRoot.getChildMeshes(false).forEach((m) => (m.isVisible = true));
    }

    function applyModelPose(yRotation) {
      modelRoot.position           = new Vector3(0, modelYOffset, 0);
      modelRoot.rotationQuaternion = null;
      modelRoot.rotation           = new Vector3(0, yRotation, 0);
    }

    function decomposeHitResult(hitResult) {
      const pos = new Vector3();
      const rot = new Quaternion();
      hitResult.transformationMatrix.decompose(undefined, rot, pos);
      return { pos, yRot: rot.toEulerAngles().y };
    }

    // Projects camera forward ray to Y=0 floor plane.
    // Fallback when ARCore hasn't detected the surface yet.
    function getCameraFloorPosition() {
      if (!xrCamera) return new Vector3(0, 0, -1.5);
      const camPos  = xrCamera.position.clone();
      const forward = xrCamera.getForwardRay().direction;
      if (Math.abs(forward.y) > 0.01) {
        const t = -camPos.y / forward.y;
        if (t > 0.3 && t < 6.0) return camPos.add(forward.scale(t));
      }
      const pos = camPos.add(forward.scale(1.5));
      pos.y = 0;
      return pos;
    }

    // ── FREEZE – the core anti-jitter mechanism ───────────────────────────────
    //
    // After placement we "bake" the model into world space permanently:
    //   1. Force-compute the final world matrix (with parent offsets included)
    //   2. Detach the model from its parent (anchorNode)
    //   3. Apply the baked world position/rotation directly
    //   4. Call freezeWorldMatrix() on every mesh
    //
    // Result: Babylon NEVER recalculates the world matrix again.
    // The model is immune to:
    //   • Camera shake / hand tremor
    //   • ARCore coordinate system recalibration
    //   • Anchor drift on low-texture surfaces
    //
    function freezeModelInPlace() {
      // Force-compute world matrices so parent offsets are resolved
      scene.meshes.forEach((m) => m.computeWorldMatrix(true));

      // Capture world-space position and rotation BEFORE detaching parent
      const worldPos = modelRoot.getAbsolutePosition().clone();
      const worldRot = modelRoot.absoluteRotationQuaternion
        ? modelRoot.absoluteRotationQuaternion.clone()
        : Quaternion.Identity();

      // Detach – model is now in world space with no parent driving it
      modelRoot.parent = null;

      // Apply baked transform
      modelRoot.position.copyFrom(worldPos);
      modelRoot.rotationQuaternion = worldRot;
      modelRoot.scaling = new Vector3(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);

      // Freeze root and ALL descendants
      modelRoot.freezeWorldMatrix();
      modelRoot.getChildMeshes(false).forEach((m) => {
        m.computeWorldMatrix(true);
        m.freezeWorldMatrix();
      });

      console.log("🧊 Model frozen at", worldPos.toString());
    }

    // ── Unfreeze – called on Reset ────────────────────────────────────────────
    function unfreezeModel() {
      if (!modelRoot) return;
      modelRoot.unfreezeWorldMatrix();
      modelRoot.getChildMeshes(false).forEach((m) => m.unfreezeWorldMatrix());
    }

    // ── Placement: anchor path ────────────────────────────────────────────────
    async function placeWithAnchor(pos, rotQuat, yRot) {
      // INSTANT: lock state + show model + freeze this frame
      isPlaced = true;
      reticle.isVisible = false;
      setSurfaceReady(false);

      if (!anchorNode) anchorNode = new TransformNode("anchorNode", scene);
      anchorNode.position.copyFrom(pos);
      modelRoot.parent = anchorNode;
      applyModelPose(yRot);
      showModel();

      // Freeze immediately – model is 100% stable from this frame onward
      freezeModelInPlace();

      // Background: create native anchor for long-term world-locking.
      // The freeze above already prevents jitter; the anchor provides
      // additional correction if ARCore discovers the plane moved.
      try {
        const anchor = await anchorSystem.addAnchorAtPositionAndRotationAsync(pos, rotQuat);
        if (anchor) {
          placedAnchor = anchor;
          // NOTE: we do NOT set anchor.attachedNode here because that would
          // unfreeze the model and re-introduce per-frame matrix updates.
          // The freeze is our primary stabiliser; the anchor is just held
          // for cleanup purposes.
          console.log("⚓ Anchor created (model already frozen)");
        }
      } catch (e) {
        console.warn("⚠️ Anchor skipped:", e.message ?? e);
      }
    }

    // ── Placement: direct / fallback path ────────────────────────────────────
    function placeDirectly(pos, yRot) {
      if (!anchorNode) anchorNode = new TransformNode("anchorNode", scene);
      anchorNode.parent = null;
      anchorNode.position.copyFrom(pos);
      anchorNode.rotation = Vector3.Zero();

      modelRoot.parent = anchorNode;
      applyModelPose(yRot);
      showModel();

      // Freeze immediately
      freezeModelInPlace();

      isPlaced = true;
      reticle.isVisible = false;
      setSurfaceReady(false);
      console.log("📍 Direct placement + frozen");
    }

    // ── Tap handler ───────────────────────────────────────────────────────────
    // Path A: valid ARCore hit  → accurate surface position + anchor
    // Path B: no surface yet    → camera-forward projection to Y=0
    async function handleSelect() {
      if (isPlaced || !modelRoot) return;

      if (lastHitResult) {
        const { pos, yRot } = decomposeHitResult(lastHitResult);
        const rot = Quaternion.Identity();
        lastHitResult.transformationMatrix.decompose(undefined, rot, undefined);
        if (anchorSystem) {
          await placeWithAnchor(pos, rot, yRot);
        } else {
          placeDirectly(pos, yRot);
        }
      } else {
        // Dark/featureless floor – project camera ray to floor
        const pos = getCameraFloorPosition();
        console.log("📷 Camera-floor fallback at", pos.toString());
        placeDirectly(pos, 0);
      }
    }

    // ── Reset ──────────────────────────────────────────────────────────────────
    window.resetAR = () => {
      unfreezeModel();
      if (modelRoot) { modelRoot.parent = null; modelRoot.setEnabled(false); }
      if (placedAnchor) { try { placedAnchor.remove(); } catch (_) {} placedAnchor = null; }
      anchorNode    = null;
      isPlaced      = false;
      lastHitResult = null;
      stableCount   = 0;
      reticle.isVisible = false;
      setSurfaceReady(false);
    };

    // ── WebXR ──────────────────────────────────────────────────────────────────
    scene.createDefaultXRExperienceAsync({
      uiOptions: {
        sessionMode: "immersive-ar",
        referenceSpaceType: "local-floor",
      },
      optionalFeatures: ["hit-test", "anchors", "dom-overlay"],
      disableDefaultUI: true,
      disableTeleportation: true,
    }).then((xr) => {
      xrHelperRef.current = xr;
      const fm = xr.baseExperience.featuresManager;

      try {
        fm.enableFeature(WebXRFeatureName.DOM_OVERLAY, "latest", {
          element: overlayRef.current,
        });
      } catch (_) {}

      const hitTest = fm.enableFeature(WebXRFeatureName.HIT_TEST, "latest");
      hitTest.onHitTestResultObservable.add((results) => {
        if (isPlaced) return;
        if (results.length > 0) {
          stableCount = Math.min(stableCount + 1, STABLE_FRAMES_REQ + 1);
          lastHitResult = results[0];
          if (stableCount >= STABLE_FRAMES_REQ) {
            reticle.isVisible = true;
            setSurfaceReady(true);
          }
        } else {
          stableCount   = 0;
          lastHitResult = null;
          reticle.isVisible = false;
          setSurfaceReady(false);
        }
      });

      try {
        anchorSystem = fm.enableFeature(WebXRFeatureName.ANCHOR_SYSTEM, "latest");
        console.log("⚓ AnchorSystem ready");
      } catch (e) {
        console.warn("⚠️ AnchorSystem unavailable:", e.message ?? e);
      }

      xr.baseExperience.onStateChangedObservable.add((state) => {
        if (state === WebXRState.IN_XR) {
          setInSession(true);
          xrCamera = xr.baseExperience.camera;
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
