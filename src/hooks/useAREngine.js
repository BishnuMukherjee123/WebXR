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
const MODEL_SCALE        = 3.0;
const RETICLE_LERP       = 0.12;
const STABLE_FRAMES_REQ  = 6;      // consecutive frames required for confidence
const VARIANCE_THRESHOLD = 0.018;  // 1.8 cm – max allowed XZ drift between frames

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

    new HemisphericLight("hemi", new Vector3(0, 1, 0), scene).intensity = 1.3;
    new DirectionalLight("dir",  new Vector3(-1, -2, -1), scene).intensity = 0.8;

    let modelRoot     = null;
    let anchorNode    = null;
    let placedAnchor  = null;
    let lastHitResult = null;
    let isPlaced      = false;
    let anchorSystem  = null;
    let xrCamera      = null;
    let selectCleanup = null;
    let stableCount   = 0;
    let stableBuffer  = [];   // ring buffer of recent hit positions for variance check
    let shadowDisc    = null;

    const _lerpPos = new Vector3();
    const _lerpRot = Quaternion.Identity();

    // ── Diagonal surface plane (shown while scanning) ─────────────────────────
    const surfacePlane = MeshBuilder.CreateGround(
      "surfacePlane",
      { width: 1.4, height: 1.4, subdivisions: 1 },
      scene
    );
    surfacePlane.isVisible  = false;
    surfacePlane.isPickable = false;

    const TEX     = 128;
    const diagTex = new DynamicTexture("diagTex", { width: TEX, height: TEX }, scene, false);
    const dCtx    = diagTex.getContext();
    dCtx.clearRect(0, 0, TEX, TEX);
    dCtx.strokeStyle = "rgba(80, 200, 255, 0.9)";
    dCtx.lineWidth   = 1.5;
    for (let i = -TEX; i < TEX * 2; i += 14) {
      dCtx.beginPath(); dCtx.moveTo(i, 0); dCtx.lineTo(i + TEX, TEX); dCtx.stroke();
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

    // ── Soft blob shadow (shown after placement) ──────────────────────────────
    // Simulates the contact shadow a real object casts on the floor.
    // Radial gradient: dark/opaque at center, fully transparent at edge.
    // This is the most important visual cue that the model is ON the floor.
    function createShadowDisc(cx, cz) {
      const disc = MeshBuilder.CreateDisc(
        "shadow",
        { radius: 0.32, tessellation: 48 },
        scene
      );
      // Lay flat on the floor
      disc.rotation.x  = Math.PI / 2;
      disc.position.x  = cx;
      disc.position.y  = 0.003; // 3 mm above floor so it renders above the surface
      disc.position.z  = cz;
      disc.isPickable  = false;

      const S   = 256;
      const tex = new DynamicTexture("shadowTex", { width: S, height: S }, scene, false);
      const sCtx = tex.getContext();
      const grad = sCtx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
      grad.addColorStop(0.0,  "rgba(0,0,0,0.72)");  // dark centre
      grad.addColorStop(0.45, "rgba(0,0,0,0.38)");  // mid
      grad.addColorStop(1.0,  "rgba(0,0,0,0.00)");  // transparent edge
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, S, S);
      tex.hasAlpha = true;
      tex.update();

      const mat = new StandardMaterial("shadowMat", scene);
      mat.diffuseTexture  = tex;
      mat.alpha           = 0.7;
      mat.disableLighting = true;
      mat.backFaceCulling = false;
      mat.zOffset         = -2;   // renders above the floor plane
      disc.material       = mat;
      return disc;
    }

    // ── Reticle ring (shown while scanning) ───────────────────────────────────
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

    // Per-frame: smooth reticle + surface plane toward detected hit position
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
        console.log("GLB loaded");
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

    // ── LIVE BOUNDS CORRECTION ────────────────────────────────────────────────
    // Problem: computing bounds at load-time (before XR starts) gives wrong
    // values because the XR coordinate system isn't active yet.
    // Solution: compute bounds AFTER showModel() in live world space, then
    // shift the model DOWN by exactly how much its base is above Y=0.
    // This guarantees the model's visual bottom is flush with the floor.
    function snapModelToFloor() {
      // Force full world matrix resolution for every mesh
      scene.meshes.forEach((m) => m.computeWorldMatrix(true));
      const bounds = modelRoot.getHierarchyBoundingVectors(true);
      const gap    = bounds.min.y; // positive = model is floating above Y=0
      if (Math.abs(gap) > 0.0005) {
        anchorNode.position.y -= gap; // push anchorNode down by the gap
        scene.meshes.forEach((m) => m.computeWorldMatrix(true)); // re-resolve
        console.log("Floor snap: corrected gap =", gap.toFixed(4), "m");
      }
    }

    // Bake world matrix permanently – immune to camera shake / ARCore drift
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

    // ── Place model: common finalization ──────────────────────────────────────
    function finalizeModelPlacement(floorX, floorZ, yRot) {
      if (!anchorNode) anchorNode = new TransformNode("anchorNode", scene);
      anchorNode.parent   = null;
      // Start at floor level; snapModelToFloor() will fine-tune
      anchorNode.position = new Vector3(floorX, 0, floorZ);
      anchorNode.rotation = Vector3.Zero();

      modelRoot.parent             = anchorNode;
      modelRoot.position           = new Vector3(0, 0, 0); // snap will set final Y
      modelRoot.rotationQuaternion = null;
      modelRoot.rotation           = new Vector3(0, yRot, 0);
      modelRoot.scaling            = new Vector3(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);

      showModel();

      // Live bounds snap — corrects any bounding-box error in real XR world space
      snapModelToFloor();

      // Freeze ALL meshes so no per-frame jitter can move the model
      freezeModelInPlace();

      // Add soft contact shadow at the model's XZ floor position
      if (shadowDisc) { shadowDisc.dispose(); shadowDisc = null; }
      shadowDisc = createShadowDisc(floorX, floorZ);

      isPlaced               = true;
      reticle.isVisible      = false;
      surfacePlane.isVisible = false;
      setSurfaceReady(false);
    }

    // ── Placement: with anchor (world-lock) ───────────────────────────────────
    async function placeWithAnchor(floorX, floorZ, rotQuat, yRot) {
      finalizeModelPlacement(floorX, floorZ, yRot);
      const pos = new Vector3(floorX, 0, floorZ);
      try {
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
        floorX = pos.x;
        floorZ = pos.z;
        yRot   = yr;
        rotQuat = Quaternion.Identity();
        lastHitResult.transformationMatrix.decompose(undefined, rotQuat, undefined);
      } else {
        const pos = getCameraFloorPosition();
        floorX = pos.x; floorZ = pos.z; yRot = 0;
      }

      // Always Y=0: physical floor in local-floor reference space
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
      if (shadowDisc)   { shadowDisc.dispose(); shadowDisc = null; }
      anchorNode = null; isPlaced = false; lastHitResult = null;
      stableCount = 0; stableBuffer = [];
      reticle.isVisible = false; surfacePlane.isVisible = false;
      setSurfaceReady(false);
    };

    // ── WebXR ─────────────────────────────────────────────────────────────────
    scene.createDefaultXRExperienceAsync({
      uiOptions: { sessionMode: "immersive-ar", referenceSpaceType: "local-floor" },
      optionalFeatures: ["hit-test", "anchors", "dom-overlay"],
      disableDefaultUI: true,
      disableTeleportation: true,
    }).then((xr) => {
      xrHelperRef.current = xr;
      const fm = xr.baseExperience.featuresManager;
      try { fm.enableFeature(WebXRFeatureName.DOM_OVERLAY, "latest", { element: overlayRef.current }); } catch (_) {}

      // ── TRUE Stable Surface Detection ────────────────────────────────────
      // Two-layer filter:
      //   Layer 1 – entityTypes: only accept hits on DETECTED PLANES or MESH.
      //             Rejects noisy point hits on un-mapped surfaces (the main
      //             source of reticle jitter and false detections).
      //   Layer 2 – position variance: the hit XZ must not drift more than
      //             VARIANCE_THRESHOLD between consecutive frames. If the
      //             surface keeps moving, the count resets.
      const hitTest = fm.enableFeature(WebXRFeatureName.HIT_TEST, "latest", {
        entityTypes: ["plane", "mesh"],  // plane = ARCore detected planes (most stable)
        enableTransientHitTest: false,   // persistent source, not one-shot
      });

      function isPositionStable(newPos) {
        // Keep only the last STABLE_FRAMES_REQ positions
        stableBuffer.push(new Vector3(newPos.x, 0, newPos.z)); // only check XZ
        if (stableBuffer.length > STABLE_FRAMES_REQ) stableBuffer.shift();
        if (stableBuffer.length < STABLE_FRAMES_REQ) return false;
        // Compute centroid
        const centroid = stableBuffer.reduce(
          (acc, p) => acc.addInPlace(p), new Vector3(0, 0, 0)
        ).scaleInPlace(1 / stableBuffer.length);
        // Reject if any sample is too far from centroid
        return stableBuffer.every(
          (p) => Vector3.Distance(p, centroid) < VARIANCE_THRESHOLD
        );
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
            // Surface is still moving / noisy – reset confidence
            stableCount = 0;
          }
          lastHitResult = hit;

          if (stableCount >= STABLE_FRAMES_REQ) {
            reticle.isVisible = true;
            setSurfaceReady(true);
          }
        } else {
          // No plane detected this frame
          stableCount  = 0;
          stableBuffer = [];
          lastHitResult = null;
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
