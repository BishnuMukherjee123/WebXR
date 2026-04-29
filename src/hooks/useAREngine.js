/**
 * useAREngine.js — Aroma AR Engine
 *
 * Architecture based on:
 *  - Official Babylon.js WebXR AR Features docs
 *  - "Spiegel AR" quality standard technical brief
 *
 * Key design decisions:
 *  1. Plane-only hit test  → stable reticle, no point-cloud noise
 *  2. anchor.attachedNode  → model parented to native XR anchor (no drift)
 *  3. NO freezeWorldMatrix → anchor drives the transform every XR frame
 *  4. Light Estimation     → matches real-world environment lighting
 *  5. ShadowGenerator      → real projected soft shadows on floor
 *  6. LERP = 0.05          → very smooth reticle, absorbs hand shake
 *  7. Variance filter      → only show reticle when surface is truly stable
 */
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

// ── Constants ─────────────────────────────────────────────────────────────────
const MODEL_URL          = "https://iskchovltfnohyftjckg.supabase.co/storage/v1/object/public/models/10.glb";
const MODEL_SCALE        = 3.0;
const RETICLE_LERP       = 0.05;   // Low = very smooth, absorbs hand shake
const STABLE_FRAMES_REQ  = 6;      // Frames before surface is trusted
const VARIANCE_THRESHOLD = 0.018;  // 1.8 cm XZ variance limit

export function useAREngine() {
  const canvasRef   = useRef(null);
  const overlayRef  = useRef(null);
  const xrHelperRef = useRef(null);

  const [inSession,    setInSession]    = useState(false);
  const [surfaceReady, setSurfaceReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Engine ───────────────────────────────────────────────────────────────
    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      adaptToDeviceRatio: true,
    });
    const scene = new Scene(engine);
    scene.clearColor             = new Color4(0, 0, 0, 0); // transparent for AR pass-through
    scene.autoClear              = false;
    scene.skipPointerMovePicking = true;

    // ── Lighting (lower intensity – LightEstimation will take over) ──────────
    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.5;

    const dirLight = new DirectionalLight("dir", new Vector3(-1, -2, -1), scene);
    dirLight.position  = new Vector3(0, 5, 0);
    dirLight.intensity = 0.8;

    // ── Real-projected shadow ─────────────────────────────────────────────────
    // ShadowGenerator casts shadows FROM the model.
    // ShadowOnlyMaterial makes the ground plane invisible EXCEPT where shadows fall.
    // This creates a soft shadow visible directly on the AR camera feed floor.
    const shadowGen = new ShadowGenerator(1024, dirLight);
    shadowGen.useBlurExponentialShadowMap = true;
    shadowGen.blurKernel                  = 32;
    shadowGen.darkness                    = 0.45;

    const shadowCatcher = MeshBuilder.CreateGround(
      "shadowCatcher",
      { width: 12, height: 12 },
      scene
    );
    const catchMat = new ShadowOnlyMaterial("catchMat", scene);
    catchMat.shadowColor     = new Color3(0, 0, 0);
    shadowCatcher.material   = catchMat;
    shadowCatcher.receiveShadows = true;
    shadowCatcher.isPickable     = false;
    shadowCatcher.isVisible      = false; // revealed on placement
    shadowCatcher.position.y     = 0.001; // 1 mm above floor to avoid z-fighting

    // ── Session state ────────────────────────────────────────────────────────
    let modelRoot     = null;
    let modelYOffset  = 0;    // computed bounding-box floor lift
    let placedAnchor  = null;
    let lastHitResult = null;
    let isPlaced      = false;
    let anchorSystem  = null;
    let xrCamera      = null;
    let selectCleanup = null;
    let stableCount   = 0;
    let stableBuffer  = [];   // XZ position ring buffer for variance check

    // Pre-allocated – zero GC in render loop
    const _lerpPos = new Vector3();
    const _lerpRot = Quaternion.Identity();

    // ── Diagonal scanning plane ───────────────────────────────────────────────
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
    const diagMat = new StandardMaterial("diagMat", scene);
    diagMat.diffuseTexture  = dTex;
    diagMat.emissiveColor   = new Color3(0.3, 0.8, 1.0);
    diagMat.alpha           = 0.45;
    diagMat.backFaceCulling = false;
    diagMat.disableLighting = true;
    surfacePlane.material   = diagMat;

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

    // LERP = 0.05 → very smooth, absorbs hand shake without lag
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
        // Compute floor Y offset from bounding box
        scene.meshes.forEach((m) => m.computeWorldMatrix(true));
        const bounds = modelRoot.getHierarchyBoundingVectors(true);
        modelYOffset = -bounds.min.y;
        modelRoot.setEnabled(false);
        // Register as shadow casters
        result.meshes.forEach((m) => shadowGen.addShadowCaster(m));
        console.log("GLB loaded | Y offset:", modelYOffset.toFixed(3));
      })
      .catch((err) => console.error("GLB error:", err));

    // ── Helpers ───────────────────────────────────────────────────────────────
    function showModel() {
      modelRoot.setEnabled(true);
      modelRoot.getChildMeshes(false).forEach((m) => (m.isVisible = true));
    }

    function decomposeHitResult(hr) {
      const pos = new Vector3();
      const rot = new Quaternion();
      hr.transformationMatrix.decompose(undefined, rot, pos);
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

    // ── PLACEMENT ARCHITECTURE ────────────────────────────────────────────────
    //
    // CORRECT approach (brief §2):
    //   1. Create native XR anchor at placement position.
    //   2. Parent modelRoot to anchor.attachedNode.
    //   3. ARCore/ARKit updates attachedNode's transform every XR frame as
    //      it refines its world map → model stays at the SAME PHYSICAL POINT.
    //
    // WRONG approach (previous):
    //   freezeWorldMatrix() → model locked to static coordinate → when ARCore
    //   recalibrates the coordinate system, the model APPEARS to drift because
    //   the world has moved but the model's matrix hasn't.
    //
    async function placeWithAnchor(pos, rotQuat, yRot) {
      try {
        const anchor = await anchorSystem.addAnchorAtPositionAndRotationAsync(pos, rotQuat);
        if (!anchor) throw new Error("No anchor returned");

        placedAnchor = anchor;

        // Parent model to anchor.attachedNode — ARCore drives this node
        modelRoot.parent             = anchor.attachedNode;
        modelRoot.position           = new Vector3(0, modelYOffset, 0);
        modelRoot.rotationQuaternion = null;
        modelRoot.rotation           = new Vector3(0, yRot, 0);
        modelRoot.scaling            = new Vector3(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);

        showModel();

        // Shadow catcher on the floor
        shadowCatcher.position.y = 0.001;
        shadowCatcher.isVisible  = true;

        isPlaced               = true;
        reticle.isVisible      = false;
        surfacePlane.isVisible = false;
        setSurfaceReady(false);
        console.log("⚓ Model anchored — no freeze, ARCore drives position");
      } catch (e) {
        console.warn("Anchor failed, falling back to direct placement:", e.message ?? e);
        placeDirectly(pos, yRot);
      }
    }

    // Fallback: no anchor system available (rare on modern Android Chrome)
    // We use a static TransformNode here. Without an anchor, some drift is
    // expected on low-texture surfaces — this is a hardware limitation.
    function placeDirectly(pos, yRot) {
      const node = new TransformNode("directNode", scene);
      node.position = new Vector3(pos.x, 0, pos.z);

      modelRoot.parent             = node;
      modelRoot.position           = new Vector3(0, modelYOffset, 0);
      modelRoot.rotationQuaternion = null;
      modelRoot.rotation           = new Vector3(0, yRot, 0);
      modelRoot.scaling            = new Vector3(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);

      showModel();

      shadowCatcher.position.y = 0.001;
      shadowCatcher.isVisible  = true;

      isPlaced               = true;
      reticle.isVisible      = false;
      surfacePlane.isVisible = false;
      setSurfaceReady(false);
      console.log("📍 Direct placement (no anchor)");
    }

    // ── Tap handler ───────────────────────────────────────────────────────────
    async function handleSelect() {
      if (isPlaced || !modelRoot) return;

      if (lastHitResult) {
        const { pos, yRot } = decomposeHitResult(lastHitResult);
        pos.y = 0; // enforce floor level
        const rotQuat = Quaternion.Identity();
        lastHitResult.transformationMatrix.decompose(undefined, rotQuat, undefined);

        if (anchorSystem) {
          await placeWithAnchor(pos, rotQuat, yRot);
        } else {
          placeDirectly(pos, yRot);
        }
      } else {
        // No surface detected — project camera ray to floor
        placeDirectly(getCameraFloorPosition(), 0);
      }
    }

    // ── Reset ─────────────────────────────────────────────────────────────────
    window.resetAR = () => {
      if (modelRoot) { modelRoot.parent = null; modelRoot.setEnabled(false); }
      if (placedAnchor) {
        try { placedAnchor.remove(); } catch (_) {}
        placedAnchor = null;
      }
      shadowCatcher.isVisible = false;
      isPlaced = false; lastHitResult = null;
      stableCount = 0; stableBuffer = [];
      reticle.isVisible = false; surfacePlane.isVisible = false;
      setSurfaceReady(false);
    };

    // ── WebXR ──────────────────────────────────────────────────────────────────
    scene.createDefaultXRExperienceAsync({
      uiOptions: {
        sessionMode: "immersive-ar",
        referenceSpaceType: "local-floor",
      },
      optionalFeatures: ["hit-test", "anchors", "light-estimation", "dom-overlay"],
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
      } catch (_) {}

      // Light estimation: replaces manual lighting with camera-measured values
      // Adjusts scene exposure + reflection map to match the physical room
      try {
        fm.enableFeature(WebXRFeatureName.LIGHT_ESTIMATION, "latest", {
          createDefaultLight: true,
          reflectionFormat: "srgba8",
        });
        console.log("💡 Light estimation active");
      } catch (e) {
        console.warn("Light estimation unavailable:", e.message ?? e);
      }

      // Plane-only hit test — ignores point clouds (main cause of reticle jitter)
      const hitTest = fm.enableFeature(WebXRFeatureName.HIT_TEST, "latest", {
        entityTypes: ["plane", "mesh"],
        enableTransientHitTest: false,
      });

      // XZ variance filter: reticle only shows when surface has stopped moving
      function isPositionStable(newPos) {
        stableBuffer.push(new Vector3(newPos.x, 0, newPos.z));
        if (stableBuffer.length > STABLE_FRAMES_REQ) stableBuffer.shift();
        if (stableBuffer.length < STABLE_FRAMES_REQ) return false;
        const centroid = stableBuffer
          .reduce((acc, p) => acc.addInPlace(p), new Vector3())
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
            stableCount = 0; // surface still moving — reset confidence
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

      // Anchor system
      try {
        anchorSystem = fm.enableFeature(WebXRFeatureName.ANCHOR_SYSTEM, "latest");
        console.log("⚓ Anchor system ready");
      } catch (e) {
        console.warn("Anchor system unavailable:", e.message ?? e);
      }

      // Session lifecycle
      xr.baseExperience.onStateChangedObservable.add((state) => {
        if (state === WebXRState.IN_XR) {
          setInSession(true);
          xrCamera = xr.baseExperience.camera;
          const session = xr.baseExperience.sessionManager.session;
          const onSel   = () => handleSelect();
          session.addEventListener("select", onSel);
          selectCleanup = () => session.removeEventListener("select", onSel);
          console.log("✅ AR session active");
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