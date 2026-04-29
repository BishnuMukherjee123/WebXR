import { useEffect, useRef, useState } from "react";
import {
  Engine, Scene, Vector3, Color4,
  HemisphericLight, DirectionalLight,
  WebXRFeatureName, WebXRState,
  Quaternion, TransformNode,
  MeshBuilder, StandardMaterial, Color3,
  DynamicTexture, ShadowGenerator,
} from "@babylonjs/core";
import { ShadowOnlyMaterial } from "@babylonjs/materials";
import "@babylonjs/loaders/glTF";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";

const MODEL_URL          = "https://iskchovltfnohyftjckg.supabase.co/storage/v1/object/public/models/10.glb";
const MODEL_SCALE        = 3.0;
const RETICLE_LERP       = 0.08;
const STABLE_FRAMES_REQ  = 4;
const VARIANCE_THRESHOLD = 0.025;

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
      preserveDrawingBuffer: true, stencil: true, adaptToDeviceRatio: true,
    });
    const scene = new Scene(engine);
    scene.clearColor             = new Color4(0, 0, 0, 0);
    scene.autoClear              = false;
    scene.skipPointerMovePicking = true;

    // Lighting – lower intensity, LightEstimation fills the rest
    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.6;
    const dir = new DirectionalLight("dir", new Vector3(-1, -2, -1), scene);
    dir.position  = new Vector3(0, 5, 0);
    dir.intensity = 0.9;

    // Shadow: ShadowGenerator → ShadowOnlyMaterial ground catcher
    const shadowGen = new ShadowGenerator(1024, dir);
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel = 32;
    shadowGen.darkness   = 0.4;

    const shadowCatcher = MeshBuilder.CreateGround("sc", { width: 12, height: 12 }, scene);
    const catchMat = new ShadowOnlyMaterial("catchMat", scene);
    catchMat.shadowColor      = new Color3(0, 0, 0);
    shadowCatcher.material    = catchMat;
    shadowCatcher.receiveShadows = true;
    shadowCatcher.isPickable  = false;
    shadowCatcher.isVisible   = false;
    shadowCatcher.position.y  = 0.001;

    // State
    let modelRoot    = null;
    let modelYOffset = 0;
    let placedAnchor = null;
    let lastHitResult = null;
    let isPlaced     = false;
    let anchorSystem = null;
    let xrCamera     = null;
    let selectCleanup = null;
    let stableCount  = 0;
    let stableBuffer = [];

    const _lerpPos = new Vector3();
    const _lerpRot = Quaternion.Identity();

    // Diagonal scanning plane
    const surfacePlane = MeshBuilder.CreateGround("sp", { width: 1.4, height: 1.4 }, scene);
    surfacePlane.isVisible = false; surfacePlane.isPickable = false;
    const TEX = 128;
    const dTex = new DynamicTexture("dt", { width: TEX, height: TEX }, scene, false);
    const dCtx = dTex.getContext();
    dCtx.clearRect(0, 0, TEX, TEX);
    dCtx.strokeStyle = "rgba(80,200,255,0.9)"; dCtx.lineWidth = 1.5;
    for (let i = -TEX; i < TEX * 2; i += 14) {
      dCtx.beginPath(); dCtx.moveTo(i, 0); dCtx.lineTo(i + TEX, TEX); dCtx.stroke();
    }
    dTex.hasAlpha = true; dTex.update();
    const diagMat = new StandardMaterial("dm", scene);
    diagMat.diffuseTexture = dTex; diagMat.emissiveColor = new Color3(0.3, 0.8, 1.0);
    diagMat.alpha = 0.45; diagMat.backFaceCulling = false; diagMat.disableLighting = true;
    surfacePlane.material = diagMat;

    // Reticle
    const reticle = MeshBuilder.CreateTorus("ret", { diameter: 0.55, thickness: 0.016, tessellation: 48 }, scene);
    reticle.rotationQuaternion = Quaternion.Identity();
    reticle.isVisible = false; reticle.isPickable = false;
    const retMat = new StandardMaterial("rm", scene);
    retMat.emissiveColor = new Color3(1, 1, 1); retMat.disableLighting = true;
    retMat.alpha = 0.8; retMat.backFaceCulling = false;
    reticle.material = retMat;

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

    // Load GLB
    SceneLoader.ImportMeshAsync("", MODEL_URL, "", scene)
      .then((result) => {
        modelRoot = result.meshes[0];
        modelRoot.scaling = new Vector3(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
        scene.meshes.forEach((m) => m.computeWorldMatrix(true));
        const b = modelRoot.getHierarchyBoundingVectors(true);
        modelYOffset = -b.min.y;
        modelRoot.setEnabled(false);
        result.meshes.forEach((m) => shadowGen.addShadowCaster(m));
        console.log("GLB ready | yOffset:", modelYOffset.toFixed(3));
      })
      .catch((e) => console.error("GLB error:", e));

    function showModel() {
      modelRoot.setEnabled(true);
      modelRoot.getChildMeshes(false).forEach((m) => (m.isVisible = true));
    }

    function applyLocalPose(parentNode, yRot) {
      modelRoot.parent             = parentNode;
      modelRoot.position           = new Vector3(0, modelYOffset, 0);
      modelRoot.rotationQuaternion = null;
      modelRoot.rotation           = new Vector3(0, yRot, 0);
      modelRoot.scaling            = new Vector3(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
    }

    function decomposeHit(hr) {
      const pos = new Vector3(), rot = new Quaternion();
      hr.transformationMatrix.decompose(undefined, rot, pos);
      return { pos, rot, yRot: rot.toEulerAngles().y };
    }

    function getCameraFloor() {
      if (!xrCamera) return new Vector3(0, 0, -1.5);
      const cam = xrCamera.position.clone();
      const fwd = xrCamera.getForwardRay().direction;
      if (Math.abs(fwd.y) > 0.01) {
        const t = -cam.y / fwd.y;
        if (t > 0.3 && t < 6.0) return cam.add(fwd.scale(t));
      }
      const p = cam.add(fwd.scale(1.5)); p.y = 0; return p;
    }

    // Placement — INSTANT visual response, anchor created in background
    async function placeModel(floorX, floorZ, yRot, rotQuat) {
      if (!modelRoot) { console.warn("Model not loaded yet"); return; }

      // 1. INSTANT: show model immediately using a temp node
      const tempNode = new TransformNode("temp", scene);
      tempNode.position = new Vector3(floorX, 0, floorZ);
      applyLocalPose(tempNode, yRot);
      showModel();
      shadowCatcher.position.x = floorX;
      shadowCatcher.position.z = floorZ;
      shadowCatcher.isVisible  = true;
      isPlaced               = true;
      reticle.isVisible      = false;
      surfacePlane.isVisible = false;
      setSurfaceReady(false);

      // 2. BACKGROUND: create native anchor for world-locking
      //    Reparent model to anchor.attachedNode when ready
      if (anchorSystem && rotQuat) {
        try {
          const pos    = new Vector3(floorX, 0, floorZ);
          const anchor = await anchorSystem.addAnchorAtPositionAndRotationAsync(pos, rotQuat);
          if (anchor?.attachedNode) {
            placedAnchor = anchor;
            applyLocalPose(anchor.attachedNode, yRot);
            tempNode.dispose();
            console.log("Anchor world-lock applied");
          }
        } catch (e) {
          console.warn("Anchor skipped:", e.message ?? e);
          // tempNode stays — model remains visible at tap position
        }
      }
    }

    async function handleSelect() {
      if (isPlaced || !modelRoot) return;
      if (lastHitResult) {
        const { pos, rot, yRot } = decomposeHit(lastHitResult);
        await placeModel(pos.x, pos.z, yRot, rot);
      } else {
        const p = getCameraFloor();
        await placeModel(p.x, p.z, 0, null);
      }
    }

    window.resetAR = () => {
      if (modelRoot) { modelRoot.parent = null; modelRoot.setEnabled(false); }
      if (placedAnchor) { try { placedAnchor.remove(); } catch (_) {} placedAnchor = null; }
      shadowCatcher.isVisible = false;
      isPlaced = false; lastHitResult = null; stableCount = 0; stableBuffer = [];
      reticle.isVisible = false; surfacePlane.isVisible = false;
      setSurfaceReady(false);
    };

    // WebXR
    scene.createDefaultXRExperienceAsync({
      uiOptions: { sessionMode: "immersive-ar", referenceSpaceType: "local-floor" },
      optionalFeatures: ["hit-test", "anchors", "light-estimation", "dom-overlay"],
      disableDefaultUI: true,
      disableTeleportation: true,
    }).then((xr) => {
      xrHelperRef.current = xr;
      const fm = xr.baseExperience.featuresManager;

      try { fm.enableFeature(WebXRFeatureName.DOM_OVERLAY, "latest", { element: overlayRef.current }); } catch (_) {}

      try {
        fm.enableFeature(WebXRFeatureName.LIGHT_ESTIMATION, "latest", {
          createDefaultLight: true, reflectionFormat: "srgba8",
        });
      } catch (_) {}

      // BUG FIX: removed entityTypes:["mesh"] — mesh-detection is a separate
      // WebXR feature not available on most devices. Using "plane" only which
      // is broadly supported. Removed unknown "enableTransientHitTest" option.
      let hitTest;
      try {
        hitTest = fm.enableFeature(WebXRFeatureName.HIT_TEST, "latest", {
          entityTypes: ["plane"],
        });
      } catch (_) {
        // Fallback: no entity type restriction — works on all devices
        hitTest = fm.enableFeature(WebXRFeatureName.HIT_TEST, "latest");
      }

      function isPositionStable(p) {
        stableBuffer.push(new Vector3(p.x, 0, p.z));
        if (stableBuffer.length > STABLE_FRAMES_REQ) stableBuffer.shift();
        if (stableBuffer.length < STABLE_FRAMES_REQ) return false;
        const c = stableBuffer.reduce((a, v) => a.addInPlace(v), new Vector3())
          .scaleInPlace(1 / stableBuffer.length);
        return stableBuffer.every((v) => Vector3.Distance(v, c) < VARIANCE_THRESHOLD);
      }

      hitTest.onHitTestResultObservable.add((results) => {
        if (isPlaced) return;
        if (results.length > 0) {
          const hit = results[0];
          const pos = new Vector3();
          hit.transformationMatrix.decompose(undefined, undefined, pos);
          if (isPositionStable(pos)) stableCount = Math.min(stableCount + 1, STABLE_FRAMES_REQ + 1);
          else stableCount = 0;
          lastHitResult = hit;
          if (stableCount >= STABLE_FRAMES_REQ) { reticle.isVisible = true; setSurfaceReady(true); }
        } else {
          stableCount = 0; stableBuffer = []; lastHitResult = null;
          reticle.isVisible = false; surfacePlane.isVisible = false; setSurfaceReady(false);
        }
      });

      try { anchorSystem = fm.enableFeature(WebXRFeatureName.ANCHOR_SYSTEM, "latest"); }
      catch (_) {}

      xr.baseExperience.onStateChangedObservable.add((state) => {
        if (state === WebXRState.IN_XR) {
          setInSession(true);
          xrCamera = xr.baseExperience.camera;
          const session = xr.baseExperience.sessionManager.session;
          const onSel = () => handleSelect();
          session.addEventListener("select", onSel);
          selectCleanup = () => session.removeEventListener("select", onSel);
        } else {
          setInSession(false); xrCamera = null;
          window.resetAR();
          if (selectCleanup) { selectCleanup(); selectCleanup = null; }
        }
      });
    }).catch((e) => console.error("XR error:", e));

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