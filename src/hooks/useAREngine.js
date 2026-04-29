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

const RETICLE_LERP = 0.12;

/**
 * useAREngine
 * Encapsulates all Babylon.js / WebXR logic.
 * Returns refs for the canvas + DOM-overlay, and reactive UI state.
 */
export function useAREngine() {
  const canvasRef  = useRef(null);
  const overlayRef = useRef(null);
  const xrHelperRef = useRef(null);

  const [inSession,    setInSession]    = useState(false);
  const [surfaceReady, setSurfaceReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Engine & scene
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const scene  = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 0);

    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 1.3;
    const dir = new DirectionalLight("dir", new Vector3(-1, -2, -1), scene);
    dir.intensity = 0.8;

    // Mutable placement state
    let modelRoot    = null;
    let modelYOffset = 0;
    let anchorNode   = null;
    let placedAnchor = null;
    let lastHitResult = null;
    let isPlaced      = false;
    let anchorSystem  = null;
    let xrCamera      = null;
    let selectCleanup = null;

    const reticleTarget = { pos: new Vector3(), rot: Quaternion.Identity(), valid: false };

    // Reticle
    const reticle = MeshBuilder.CreateTorus(
      "reticle",
      { diameter: 0.5, thickness: 0.02, tessellation: 48 },
      scene
    );
    reticle.rotationQuaternion = Quaternion.Identity();
    reticle.isVisible = false;
    const reticleMat = new StandardMaterial("reticleMat", scene);
    reticleMat.emissiveColor     = new Color3(1, 1, 1);
    reticleMat.disableLighting   = true;
    reticleMat.alpha             = 0.65;
    reticle.material             = reticleMat;

    // Lerp reticle every frame
    scene.registerBeforeRender(() => {
      if (isPlaced || !reticleTarget.valid) return;
      reticle.position = Vector3.Lerp(reticle.position, reticleTarget.pos, RETICLE_LERP);
      Quaternion.SlerpToRef(
        reticle.rotationQuaternion, reticleTarget.rot,
        RETICLE_LERP, reticle.rotationQuaternion
      );
    });

    // Load GLB
    SceneLoader.ImportMeshAsync("", MODEL_URL, "", scene)
      .then((result) => {
        modelRoot = result.meshes[0];
        modelRoot.scaling = new Vector3(3.0, 3.0, 3.0);
        scene.meshes.forEach((m) => m.computeWorldMatrix(true));
        const bounds = modelRoot.getHierarchyBoundingVectors(true);
        modelYOffset = -bounds.min.y;
        modelRoot.setEnabled(false);
        console.log("✅ GLB loaded | floorOffset =", modelYOffset.toFixed(3));
      })
      .catch((err) => console.error("❌ GLB error:", err));

    // Helpers
    function showModel() {
      modelRoot.setEnabled(true);
      modelRoot.getChildMeshes(false).forEach((m) => (m.isVisible = true));
    }

    function applyPose(yRotation) {
      modelRoot.position = new Vector3(0, modelYOffset, 0);
      modelRoot.rotationQuaternion = null;
      modelRoot.rotation = new Vector3(0, yRotation, 0);
    }

    async function placeWithAnchor(hitResult, yRotation) {
      const anchor = await anchorSystem.addAnchorPointUsingHitTestResultAsync(hitResult);
      if (!anchor) return false;
      placedAnchor = anchor;
      if (!anchorNode) anchorNode = new TransformNode("anchorNode", scene);
      anchor.attachedNode = anchorNode;
      modelRoot.parent = anchorNode;
      applyPose(yRotation);
      showModel();
      isPlaced = true;
      reticle.isVisible = false;
      setSurfaceReady(false);
      console.log("⚓ Placed via anchor");
      return true;
    }

    function placeDirectly(position, yRotation) {
      if (!anchorNode) anchorNode = new TransformNode("anchorNode", scene);
      anchorNode.parent = null;
      anchorNode.position.copyFrom(position);
      anchorNode.rotationQuaternion = null;
      anchorNode.rotation = Vector3.Zero();
      modelRoot.parent = anchorNode;
      applyPose(yRotation);
      showModel();
      isPlaced = true;
      reticle.isVisible = false;
      setSurfaceReady(false);
      console.log("📍 Placed directly");
    }

    async function handleSelect() {
      if (isPlaced || !modelRoot || !lastHitResult) return;
      const pos = new Vector3();
      const rot = new Quaternion();
      lastHitResult.transformationMatrix.decompose(undefined, rot, pos);
      const yRot = rot.toEulerAngles().y;
      if (anchorSystem) {
        try {
          if (await placeWithAnchor(lastHitResult, yRot)) return;
        } catch (e) {
          console.warn("⚠️ Anchor failed:", e.message);
        }
      }
      placeDirectly(pos, yRot);
    }

    window.resetAR = () => {
      if (modelRoot) { modelRoot.parent = null; modelRoot.setEnabled(false); }
      if (placedAnchor) { try { placedAnchor.remove(); } catch (_) {} placedAnchor = null; }
      anchorNode = null;
      isPlaced   = false;
      lastHitResult = null;
      reticleTarget.valid = false;
      reticle.isVisible = false;
      setSurfaceReady(false);
    };

    // WebXR
    scene.createDefaultXRExperienceAsync({
      uiOptions: { sessionMode: "immersive-ar", referenceSpaceType: "local-floor" },
      optionalFeatures: true,
      disableDefaultUI: true,
      disableTeleportation: true,
    }).then((xr) => {
      xrHelperRef.current = xr;
      const fm = xr.baseExperience.featuresManager;

      try {
        fm.enableFeature(WebXRFeatureName.DOM_OVERLAY, "latest", { element: overlayRef.current });
      } catch (_) {}

      const hitTest = fm.enableFeature(WebXRFeatureName.HIT_TEST, "latest");
      hitTest.onHitTestResultObservable.add((results) => {
        if (isPlaced) return;
        if (results.length > 0) {
          lastHitResult = results[0];
          const pos = new Vector3(); const rot = new Quaternion();
          results[0].transformationMatrix.decompose(undefined, rot, pos);
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

      try {
        anchorSystem = fm.enableFeature(WebXRFeatureName.ANCHOR_SYSTEM, "latest");
      } catch (_) {}

      xr.baseExperience.onStateChangedObservable.add((state) => {
        if (state === WebXRState.IN_XR) {
          setInSession(true);
          xrCamera = xr.baseExperience.camera; // eslint-disable-line no-unused-vars
          const session = xr.baseExperience.sessionManager.session;
          const onSelect = () => handleSelect();
          session.addEventListener("select", onSelect);
          selectCleanup = () => session.removeEventListener("select", onSelect);
        } else {
          setInSession(false);
          xrCamera = null;
          window.resetAR();
          if (selectCleanup) { selectCleanup(); selectCleanup = null; }
        }
      });
    }).catch((err) => console.error("❌ XR error:", err));

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
