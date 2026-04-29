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
  DynamicTexture,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";

const MODEL_URL         = "https://iskchovltfnohyftjckg.supabase.co/storage/v1/object/public/models/10.glb";
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

    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, adaptToDeviceRatio: true });
    const scene  = new Scene(engine);
    scene.clearColor             = new Color4(0, 0, 0, 0);
    scene.autoClear              = false;
    scene.skipPointerMovePicking = true;

    new HemisphericLight("hemi", new Vector3(0, 1, 0), scene).intensity = 1.3;
    new DirectionalLight("dir",  new Vector3(-1, -2, -1), scene).intensity = 0.8;

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

    const _lerpPos = new Vector3();
    const _lerpRot = Quaternion.Identity();

    // ── Diagonal-line surface plane ───────────────────────────────────────────
    // Draws a repeating diagonal hatch texture on a flat ground mesh that sits
    // at the detected surface position – exactly like in the reference screenshot.
    const PLANE_SIZE = 1.4;
    const surfacePlane = MeshBuilder.CreateGround(
      "surfacePlane",
      { width: PLANE_SIZE, height: PLANE_SIZE, subdivisions: 1 },
      scene
    );
    surfacePlane.isVisible  = false;
    surfacePlane.isPickable = false;

    // Build diagonal stripe texture with DynamicTexture (no file dependency)
    const TEX = 128;
    const diagTex = new DynamicTexture("diagTex", { width: TEX, height: TEX }, scene, false);
    const ctx     = diagTex.getContext();
    ctx.clearRect(0, 0, TEX, TEX);
    ctx.strokeStyle = "rgba(80, 200, 255, 0.9)";
    ctx.lineWidth   = 1.5;
    for (let i = -TEX; i < TEX * 2; i += 14) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + TEX, TEX); ctx.stroke();
    }
    diagTex.hasAlpha = true;
    diagTex.update();

    const surfaceMat = new StandardMaterial("surfaceMat", scene);
    surfaceMat.diffuseTexture  = diagTex;
    surfaceMat.emissiveColor   = new Color3(0.3, 0.8, 1.0);
    surfaceMat.alpha           = 0.45;
    surfaceMat.backFaceCulling = false;
    surfaceMat.disableLighting = true;
    surfacePlane.material      = surfaceMat;

    // ── Ring reticle (thin torus) ─────────────────────────────────────────────
    const reticle = MeshBuilder.CreateTorus(
      "reticle",
      { diameter: 0.55, thickness: 0.016, tessellation: 48 },
      scene
    );
    reticle.rotationQuaternion = Quaternion.Identity();
    reticle.isVisible  = false;
    reticle.isPickable = false;

    const reticleMat = new StandardMaterial("reticleMat", scene);
    reticleMat.emissiveColor   = new Color3(1, 1, 1);
    reticleMat.disableLighting = true;
    reticleMat.alpha           = 0.8;
    reticleMat.backFaceCulling = false;
    reticle.material           = reticleMat;

    // Smooth both reticle and surface plane every frame (zero allocations)
    scene.registerBeforeRender(() => {
      if (isPlaced || !lastHitResult) {
        surfacePlane.isVisible = false;
        return;
      }
      lastHitResult.transformationMatrix.decompose(undefined, _lerpRot, _lerpPos);
      Vector3.LerpToRef(reticle.position,           _lerpPos, RETICLE_LERP, reticle.position);
      Quaternion.SlerpToRef(reticle.rotationQuaternion, _lerpRot, RETICLE_LERP, reticle.rotationQuaternion);

      // Surface plane sits 1mm below reticle, follows same XZ, always flat (Y=0)
      surfacePlane.position.x = reticle.position.x;
      surfacePlane.position.y = reticle.position.y - 0.001;
      surfacePlane.position.z = reticle.position.z;
      surfacePlane.isVisible  = reticle.isVisible;
    });

    // ── Load GLB ─────────────────────────────────────────────────────────────
    SceneLoader.ImportMeshAsync("", MODEL_URL, "", scene)
      .then((result) => {
        modelRoot = result.meshes[0];
        modelRoot.scaling = new Vector3(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
        scene.meshes.forEach((m) => m.computeWorldMatrix(true));
        const bounds = modelRoot.getHierarchyBoundingVectors(true);
        modelYOffset = -bounds.min.y;
        modelRoot.setEnabled(false);
        console.log("✅ GLB ready | floorOffset =", modelYOffset.toFixed(3));
      })
      .catch((err) => console.error("❌ GLB error:", err));

    // ── Helpers ───────────────────────────────────────────────────────────────
    function showModel() {
      modelRoot.setEnabled(true);
      modelRoot.getChildMeshes(false).forEach((m) => (m.isVisible = true));
    }

    function applyModelPose(yRot) {
      modelRoot.position           = new Vector3(0, modelYOffset, 0);
      modelRoot.rotationQuaternion = null;
      modelRoot.rotation           = new Vector3(0, yRot, 0);
    }

    function decomposeHitResult(hitResult) {
      const pos = new Vector3();
      const rot = new Quaternion();
      hitResult.transformationMatrix.decompose(undefined, rot, pos);
      return { pos, yRot: rot.toEulerAngles().y };
    }

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

    // ── Freeze – bake world matrix, immune to shake/drift ────────────────────
    function freezeModelInPlace() {
      scene.meshes.forEach((m) => m.computeWorldMatrix(true));
      const worldPos = modelRoot.getAbsolutePosition().clone();
      const worldRot = modelRoot.absoluteRotationQuaternion
        ? modelRoot.absoluteRotationQuaternion.clone()
        : Quaternion.Identity();
      modelRoot.parent           = null;
      modelRoot.position.copyFrom(worldPos);
      modelRoot.rotationQuaternion = worldRot;
      modelRoot.scaling            = new Vector3(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
      modelRoot.freezeWorldMatrix();
      modelRoot.getChildMeshes(false).forEach((m) => {
        m.computeWorldMatrix(true);
        m.freezeWorldMatrix();
      });
      console.log("🧊 Model frozen at", worldPos.toString());
    }

    function unfreezeModel() {
      if (!modelRoot) return;
      modelRoot.unfreezeWorldMatrix();
      modelRoot.getChildMeshes(false).forEach((m) => m.unfreezeWorldMatrix());
    }

    // ── Placement: anchor path ────────────────────────────────────────────────
    async function placeWithAnchor(pos, rotQuat, yRot) {
      isPlaced = true;
      reticle.isVisible      = false;
      surfacePlane.isVisible = false;
      setSurfaceReady(false);

      if (!anchorNode) anchorNode = new TransformNode("anchorNode", scene);
      anchorNode.position.copyFrom(pos);
      modelRoot.parent = anchorNode;
      applyModelPose(yRot);
      showModel();
      freezeModelInPlace();

      try {
        const anchor = await anchorSystem.addAnchorAtPositionAndRotationAsync(pos, rotQuat);
        if (anchor) { placedAnchor = anchor; console.log("⚓ Anchor created"); }
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
      freezeModelInPlace();
      isPlaced = true;
      reticle.isVisible      = false;
      surfacePlane.isVisible = false;
      setSurfaceReady(false);
      console.log("📍 Direct + frozen");
    }

    // ── Tap handler ───────────────────────────────────────────────────────────
    async function handleSelect() {
      if (isPlaced || !modelRoot) return;
      if (lastHitResult) {
        const { pos, yRot } = decomposeHitResult(lastHitResult);
        const rot = Quaternion.Identity();
        lastHitResult.transformationMatrix.decompose(undefined, rot, undefined);
        anchorSystem ? await placeWithAnchor(pos, rot, yRot) : placeDirectly(pos, yRot);
      } else {
        placeDirectly(getCameraFloorPosition(), 0);
      }
    }

    // ── Reset ──────────────────────────────────────────────────────────────────
    window.resetAR = () => {
      unfreezeModel();
      if (modelRoot)    { modelRoot.parent = null; modelRoot.setEnabled(false); }
      if (placedAnchor) { try { placedAnchor.remove(); } catch (_) {} placedAnchor = null; }
      anchorNode             = null;
      isPlaced               = false;
      lastHitResult          = null;
      stableCount            = 0;
      reticle.isVisible      = false;
      surfacePlane.isVisible = false;
      setSurfaceReady(false);
    };

    // ── WebXR ──────────────────────────────────────────────────────────────────
    scene.createDefaultXRExperienceAsync({
      uiOptions: { sessionMode: "immersive-ar", referenceSpaceType: "local-floor" },
      optionalFeatures: ["hit-test", "anchors", "dom-overlay"],
      disableDefaultUI: true,
      disableTeleportation: true,
    }).then((xr) => {
      xrHelperRef.current = xr;
      const fm = xr.baseExperience.featuresManager;

      try { fm.enableFeature(WebXRFeatureName.DOM_OVERLAY, "latest", { element: overlayRef.current }); } catch (_) {}

      const hitTest = fm.enableFeature(WebXRFeatureName.HIT_TEST, "latest");
      hitTest.onHitTestResultObservable.add((results) => {
        if (isPlaced) return;
        if (results.length > 0) {
          stableCount   = Math.min(stableCount + 1, STABLE_FRAMES_REQ + 1);
          lastHitResult = results[0];
          if (stableCount >= STABLE_FRAMES_REQ) { reticle.isVisible = true; setSurfaceReady(true); }
        } else {
          stableCount            = 0;
          lastHitResult          = null;
          reticle.isVisible      = false;
          surfacePlane.isVisible = false;
          setSurfaceReady(false);
        }
      });

      try { anchorSystem = fm.enableFeature(WebXRFeatureName.ANCHOR_SYSTEM, "latest"); console.log("⚓ Anchors ready"); }
      catch (e) { console.warn("⚠️ No anchors:", e.message ?? e); }

      xr.baseExperience.onStateChangedObservable.add((state) => {
        if (state === WebXRState.IN_XR) {
          setInSession(true);
          xrCamera = xr.baseExperience.camera;
          const session = xr.baseExperience.sessionManager.session;
          const onSel   = () => handleSelect();
          session.addEventListener("select", onSel);
          selectCleanup = () => session.removeEventListener("select", onSel);
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
