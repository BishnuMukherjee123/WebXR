import { useEffect, useRef, useState } from "react";
import {
  Engine, Scene, Vector3, Color4,
  HemisphericLight, DirectionalLight,
  WebXRFeatureName, WebXRState,
  Quaternion, TransformNode, MeshBuilder,
  StandardMaterial, Color3, DynamicTexture,
  ShadowGenerator,
} from "@babylonjs/core";
import { ShadowOnlyMaterial } from "@babylonjs/materials";
import "@babylonjs/loaders/glTF";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";

const MODEL_URL          = "https://iskchovltfnohyftjckg.supabase.co/storage/v1/object/public/models/10.glb";
const MODEL_SCALE        = 3.0;
const RETICLE_LERP       = 0.12;
const STABLE_FRAMES_REQ  = 6;
const VARIANCE_THRESHOLD = 0.018; // 1.8 cm max XZ drift

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

    // ── Lighting ──────────────────────────────────────────────────────────────
    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.6;

    // Directional light – source for ShadowGenerator
    const dirLight = new DirectionalLight("dir", new Vector3(-1, -2, -1), scene);
    dirLight.position  = new Vector3(0, 5, 0);
    dirLight.intensity = 1.0;

    // ── Real projected shadow setup ───────────────────────────────────────────
    // ShadowGenerator casts shadows FROM the model ONTO shadowPlane.
    // ShadowOnlyMaterial makes the ground mesh invisible except where shadows land.
    // This creates a realistic ground shadow visible in AR pass-through.
    const shadowGen = new ShadowGenerator(1024, dirLight);
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel                 = 32;
    shadowGen.darkness                   = 0.4;   // 0=full black shadow, 1=invisible

    const shadowCatcher = MeshBuilder.CreateGround(
      "shadowCatcher",
      { width: 10, height: 10 },
      scene
    );
    const shadowCatchMat        = new ShadowOnlyMaterial("shadowCatchMat", scene);
    shadowCatchMat.shadowColor  = new Color3(0, 0, 0);
    shadowCatcher.material      = shadowCatchMat;
    shadowCatcher.receiveShadows = true;
    shadowCatcher.isPickable     = false;
    shadowCatcher.isVisible      = false; // hidden until model is placed

    // ── Session state ────────────────────────────────────────────────────────
    let modelRoot     = null;
    let anchorNode    = null;
    let placedAnchor  = null;
    let lastHitResult = null;
    let isPlaced      = false;
    let anchorSystem  = null;
    let xrCamera      = null;
    let selectCleanup = null;
    let stableCount   = 0;
    let stableBuffer  = [];

    const _lerpPos = new Vector3();
    const _lerpRot = Quaternion.Identity();

    // ── Diagonal surface plane (scanning UI) ──────────────────────────────────
    const surfacePlane = MeshBuilder.CreateGround(
      "surfacePlane",
      { width: 1.4, height: 1.4, subdivisions: 1 },
      scene
    );
    surfacePlane.isVisible  = false;
    surfacePlane.isPickable = false;

    const TEX  = 128;
    const dTex = new DynamicTexture("diagTex", { width: TEX, height: TEX }, scene, false);
    const dCtx = dTex.getContext();
    dCtx.clearRect(0, 0, TEX, TEX);
    dCtx.strokeStyle = "rgba(80, 200, 255, 0.9)";
    dCtx.lineWidth   = 1.5;
    for (let i = -TEX; i < TEX * 2; i += 14) {
      dCtx.beginPath(); dCtx.moveTo(i, 0); dCtx.lineTo(i + TEX, TEX); dCtx.stroke();
    }
    dTex.hasAlpha = true;
    dTex.update();
    const surfaceMat = new StandardMaterial("surfaceMat", scene);
    surfaceMat.diffuseTexture  = dTex;
    surfaceMat.emissiveColor   = new Color3(0.3, 0.8, 1.0);
    surfaceMat.alpha           = 0.45;
    surfaceMat.backFaceCulling = false;
    surfaceMat.disableLighting = true;
    surfacePlane.material      = surfaceMat;

    // ── Reticle ring ──────────────────────────────────────────────────────────
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

    // Per-frame: lerp reticle + surface plane toward hit position
    scene.registerBeforeRender(() => {
      if (isPlaced || !lastHitResult) { surfacePlane.isVisible = false; return; }
      lastHitResult.transformationMatrix.decompose(undefined, _lerpRot, _lerpPos);
      Vector3.LerpToRef(reticle.position, _lerpPos, RETICLE_LERP, reticle.position);
      Quaternion.SlerpToRef(reticle.rotationQuaternion, _lerpRot, RETICLE_LERP, reticle.rotationQuaternion);
      surfacePlane.position.x = reticle.position.x;
      surfacePlane.position.y = reticle.position.y - 0.001;
      surfacePlane.position.z = reticle.position.z;
      surfacePlane.isVisible  = reticle.isVisible;
    });

    // ── Load GLB ──────────────────────────────────────────────────────────────
    SceneLoader.ImportMeshAsync("", MODEL_URL, "", scene)
      .then((result) => {
        modelRoot = result.meshes[0];
        modelRoot.scaling = new Vector3(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
        modelRoot.setEnabled(false);
        // Register every child mesh as a shadow caster
        result.meshes.forEach((m) => shadowGen.addShadowCaster(m));
        console.log("GLB loaded, shadow casters registered");
      })
      .catch((err) => console.error("GLB error:", err));

    // ── Helpers ───────────────────────────────────────────────────────────────
    function showModel() {
      modelRoot.setEnabled(true);
      modelRoot.getChildMeshes(false).forEach((m) => (m.isVisible = true));
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

    // Live bounds snap: corrects bounding-box error in actual XR world space
    function snapModelToFloor() {
      scene.meshes.forEach((m) => m.computeWorldMatrix(true));
      const bounds = modelRoot.getHierarchyBoundingVectors(true);
      const gap    = bounds.min.y;
      if (Math.abs(gap) > 0.0005) {
        anchorNode.position.y -= gap;
        scene.meshes.forEach((m) => m.computeWorldMatrix(true));
      }
    }

    // Bake world matrix – immune to camera shake and ARCore drift
    function freezeModelInPlace() {
      scene.meshes.forEach((m) => m.computeWorldMatrix(true));
      const worldPos = modelRoot.getAbsolutePosition().clone();
      const worldRot = modelRoot.absoluteRotationQuaternion
        ? modelRoot.absoluteRotationQuaternion.clone()
        : Quaternion.Identity();
      modelRoot.parent             = null;
      modelRoot.position.copyFrom(worldPos);
      modelRoot.rotationQuaternion = worldRot;
      modelRoot.scaling            = new Vector3(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
      modelRoot.freezeWorldMatrix();
      modelRoot.getChildMeshes(false).forEach((m) => {
        m.computeWorldMatrix(true);
        m.freezeWorldMatrix();
      });
      console.log("Model frozen at Y:", worldPos.y.toFixed(4));
    }

    function unfreezeModel() {
      if (!modelRoot) return;
      modelRoot.unfreezeWorldMatrix();
      modelRoot.getChildMeshes(false).forEach((m) => m.unfreezeWorldMatrix());
    }

    // ── Place model ───────────────────────────────────────────────────────────
    function finalizeModelPlacement(floorX, floorZ, yRot) {
      if (!anchorNode) anchorNode = new TransformNode("anchorNode", scene);
      anchorNode.parent   = null;
      anchorNode.position = new Vector3(floorX, 0, floorZ);
      anchorNode.rotation = Vector3.Zero();

      modelRoot.parent             = anchorNode;
      modelRoot.position           = Vector3.Zero();
      modelRoot.rotationQuaternion = null;
      modelRoot.rotation           = new Vector3(0, yRot, 0);
      modelRoot.scaling            = new Vector3(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);

      showModel();
      snapModelToFloor();         // exact floor alignment
      freezeModelInPlace();       // no more jitter

      // Show shadow catcher at floor level (Y=0 so shadow lands on floor)
      shadowCatcher.position.y = 0.001;
      shadowCatcher.isVisible  = true;

      isPlaced               = true;
      reticle.isVisible      = false;
      surfacePlane.isVisible = false;
      setSurfaceReady(false);
    }

    async function placeWithAnchor(floorX, floorZ, rotQuat, yRot) {
      finalizeModelPlacement(floorX, floorZ, yRot);
      try {
        const pos    = new Vector3(floorX, 0, floorZ);
        const anchor = await anchorSystem.addAnchorAtPositionAndRotationAsync(pos, rotQuat);
        if (anchor) { placedAnchor = anchor; console.log("Anchor created"); }
      } catch (e) { console.warn("Anchor skipped:", e.message ?? e); }
    }

    // ── Tap handler ───────────────────────────────────────────────────────────
    async function handleSelect() {
      if (isPlaced || !modelRoot) return;

      let floorX, floorZ, yRot, rotQuat;
      if (lastHitResult) {
        const { pos, yRot: yr } = decomposeHitResult(lastHitResult);
        floorX  = pos.x; floorZ = pos.z; yRot = yr;
        rotQuat = Quaternion.Identity();
        lastHitResult.transformationMatrix.decompose(undefined, rotQuat, undefined);
      } else {
        const pos = getCameraFloorPosition();
        floorX = pos.x; floorZ = pos.z; yRot = 0;
      }

      if (anchorSystem && rotQuat) {
        await placeWithAnchor(floorX, floorZ, rotQuat, yRot);
      } else {
        finalizeModelPlacement(floorX, floorZ, yRot);
      }
    }

    // ── Reset ─────────────────────────────────────────────────────────────────
    window.resetAR = () => {
      unfreezeModel();
      if (modelRoot)    { modelRoot.parent = null; modelRoot.setEnabled(false); }
      if (placedAnchor) { try { placedAnchor.remove(); } catch (_) {} placedAnchor = null; }
      shadowCatcher.isVisible = false;
      anchorNode = null; isPlaced = false; lastHitResult = null;
      stableCount = 0; stableBuffer = [];
      reticle.isVisible = false; surfacePlane.isVisible = false;
      setSurfaceReady(false);
    };

    // ── WebXR ──────────────────────────────────────────────────────────────────
    scene.createDefaultXRExperienceAsync({
      uiOptions: { sessionMode: "immersive-ar", referenceSpaceType: "local-floor" },
      optionalFeatures: ["hit-test", "anchors", "dom-overlay", "light-estimation"],
      disableDefaultUI: true,
      disableTeleportation: true,
    }).then((xr) => {
      xrHelperRef.current = xr;
      const fm = xr.baseExperience.featuresManager;

      try { fm.enableFeature(WebXRFeatureName.DOM_OVERLAY, "latest", { element: overlayRef.current }); } catch (_) {}

      // Light estimation: adjusts scene lighting to match real-world environment
      try {
        fm.enableFeature(WebXRFeatureName.LIGHT_ESTIMATION, "latest", {
          createDefaultLight: true,
          reflectionFormat: "srgba8",
        });
        console.log("Light estimation enabled");
      } catch (e) { console.warn("Light estimation unavailable:", e.message ?? e); }

      // True stable surface detection: planes only + position variance filter
      const hitTest = fm.enableFeature(WebXRFeatureName.HIT_TEST, "latest", {
        entityTypes: ["plane", "mesh"],
        enableTransientHitTest: false,
      });

      function isPositionStable(newPos) {
        stableBuffer.push(new Vector3(newPos.x, 0, newPos.z));
        if (stableBuffer.length > STABLE_FRAMES_REQ) stableBuffer.shift();
        if (stableBuffer.length < STABLE_FRAMES_REQ) return false;
        const centroid = stableBuffer
          .reduce((acc, p) => acc.addInPlace(p), new Vector3(0, 0, 0))
          .scaleInPlace(1 / stableBuffer.length);
        return stableBuffer.every((p) => Vector3.Distance(p, centroid) < VARIANCE_THRESHOLD);
      }

      hitTest.onHitTestResultObservable.add((results) => {
        if (isPlaced) return;
        if (results.length > 0) {
          const hit = results[0];
          const pos = new Vector3();
          hit.transformationMatrix.decompose(undefined, undefined, pos);
          if (isPositionStable(pos)) {
            stableCount = Math.min(stableCount + 1, STABLE_FRAMES_REQ + 1);
          } else {
            stableCount = 0;
          }
          lastHitResult = hit;
          if (stableCount >= STABLE_FRAMES_REQ) {
            reticle.isVisible = true;
            setSurfaceReady(true);
          }
        } else {
          stableCount = 0; stableBuffer = []; lastHitResult = null;
          reticle.isVisible = false; surfacePlane.isVisible = false;
          setSurfaceReady(false);
        }
      });

      try { anchorSystem = fm.enableFeature(WebXRFeatureName.ANCHOR_SYSTEM, "latest"); }
      catch (e) { console.warn("No anchors:", e.message ?? e); }

      xr.baseExperience.onStateChangedObservable.add((state) => {
        if (state === WebXRState.IN_XR) {
          setInSession(true);
          xrCamera = xr.baseExperience.camera;
          const session = xr.baseExperience.sessionManager.session;
          const onSel   = () => handleSelect();
          session.addEventListener("select", onSel);
          selectCleanup = () => session.removeEventListener("select", onSel);
        } else {
          setInSession(false); xrCamera = null;
          window.resetAR();
          if (selectCleanup) { selectCleanup(); selectCleanup = null; }
        }
      });
    }).catch((err) => console.error("XR error:", err));

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