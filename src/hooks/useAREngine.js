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
const SURFACE_FLOAT      = 0.05;
const SURFACE_POSE_LERP  = 0.18;
const MAPPED_PLANE_SIZE  = 3.8;
const MAPPED_PLANE_MAX_SCALE = 3.2;
const MAPPED_PLANE_SPREAD_MARGIN = 0.75;
const MAPPED_PLANE_SPREAD_LERP = 0.12;
const RING_DIAMETER      = 1.35;
const STABLE_FRAMES_REQ  = 2;
const VARIANCE_THRESHOLD = 0.08;

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

    const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemi.intensity = 0.6;
    const dir = new DirectionalLight("dir", new Vector3(-1, -2, -1), scene);
    dir.position  = new Vector3(0, 5, 0);
    dir.intensity = 0.9;

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

    let modelRoot     = null;
    let modelYOffset  = 0;
    let placementNode = null;
    let isPlaced      = false;
    let xrCamera      = null;
    let selectCleanup = null;
    let stableCount   = 0;
    let stableBuffer  = [];
    let planeReady    = false;
    let hasPlanePose  = false;
    let hasMappedPose = false;
    let mappedPlaneScale = 1;
    let targetMappedPlaneScale = 1;

    const _targetPlanePos = new Vector3();
    const _targetPlaneRot = Quaternion.Identity();
    const _mappedPlanePos = new Vector3();
    const _mappedPlaneRot = Quaternion.Identity();
    const _planeNormal = new Vector3(0, 1, 0);
    const _inverseSurface = new Vector3();

    const surfacePlane = MeshBuilder.CreateGround("sp", { width: MAPPED_PLANE_SIZE, height: MAPPED_PLANE_SIZE }, scene);
    surfacePlane.isVisible = false;
    surfacePlane.isPickable = false;
    const TEX = 128;
    const dTex = new DynamicTexture("dt", { width: TEX, height: TEX }, scene, false);
    const dCtx = dTex.getContext();
    dCtx.clearRect(0, 0, TEX, TEX);
    dCtx.strokeStyle = "rgba(80,200,255,0.9)";
    dCtx.lineWidth = 1.5;
    for (let i = -TEX; i < TEX * 2; i += 14) {
      dCtx.beginPath();
      dCtx.moveTo(i, 0);
      dCtx.lineTo(i + TEX, TEX);
      dCtx.stroke();
    }
    
    dTex.hasAlpha = true;
    dTex.update();
    const diagMat = new StandardMaterial("dm", scene);
    diagMat.diffuseTexture = dTex;
    diagMat.emissiveColor = new Color3(0.3, 0.8, 1.0);
    diagMat.alpha = 0.55;
    diagMat.backFaceCulling = false;
    diagMat.disableLighting = true;
    surfacePlane.material = diagMat;

    const reticle = MeshBuilder.CreateTorus("ret", { diameter: RING_DIAMETER, thickness: 0.035, tessellation: 96 }, scene);
    reticle.rotationQuaternion = Quaternion.Identity();
    reticle.isVisible = false;
    reticle.isPickable = false;
    const retMat = new StandardMaterial("rm", scene);
    retMat.emissiveColor = new Color3(1, 1, 1);
    retMat.disableLighting = true;
    retMat.alpha = 0.8;
    retMat.backFaceCulling = false;
    reticle.material = retMat;

    function getCameraPointOnSurface() {
      if (!xrCamera || !hasMappedPose) return new Vector3(0, 0, -1.5);
      const ray = xrCamera.getForwardRay(8);
      const origin = ray.origin;
      const dir = ray.direction;
      Vector3.TransformNormalToRef(Vector3.Up(), surfacePlane.getWorldMatrix(), _planeNormal);
      _planeNormal.normalize();

      const denom = Vector3.Dot(dir, _planeNormal);
      if (Math.abs(denom) > 0.015) {
        const t = Vector3.Dot(surfacePlane.position.subtract(origin), _planeNormal) / denom;
        if (t > 0.2 && t < 8.0) return origin.add(dir.scale(t));
      }

      const p = origin.add(dir.scale(1.5));
      const dist = Vector3.Dot(p.subtract(surfacePlane.position), _planeNormal);
      p.subtractInPlace(_planeNormal.scale(dist));
      return p;
    }

    function spreadMappedPlaneTo(point) {
      if (!hasMappedPose) return;
      Vector3.TransformCoordinatesToRef(point, surfacePlane.getWorldMatrix().clone().invert(), _inverseSurface);
      const neededHalfSize = Math.max(Math.abs(_inverseSurface.x), Math.abs(_inverseSurface.z)) + MAPPED_PLANE_SPREAD_MARGIN;
      const neededScale = Math.min(
        MAPPED_PLANE_MAX_SCALE,
        Math.max(1, (neededHalfSize * 2) / MAPPED_PLANE_SIZE),
      );
      targetMappedPlaneScale = Math.max(targetMappedPlaneScale, neededScale);
    }

    scene.registerBeforeRender(() => {
      if (isPlaced) {
        surfacePlane.isVisible = false;
        return;
      }

      Vector3.LerpToRef(surfacePlane.position, _mappedPlanePos, SURFACE_POSE_LERP, surfacePlane.position);
      Quaternion.SlerpToRef(surfacePlane.rotationQuaternion, _mappedPlaneRot, SURFACE_POSE_LERP, surfacePlane.rotationQuaternion);
      const tapPoint = getCameraPointOnSurface();
      spreadMappedPlaneTo(tapPoint);
      mappedPlaneScale += (targetMappedPlaneScale - mappedPlaneScale) * MAPPED_PLANE_SPREAD_LERP;
      surfacePlane.scaling.set(mappedPlaneScale, 1, mappedPlaneScale);
      reticle.position.copyFrom(tapPoint);
      reticle.rotationQuaternion?.copyFrom(surfacePlane.rotationQuaternion);
      reticle.isVisible = Boolean(modelRoot && planeReady && hasMappedPose);
      surfacePlane.isVisible = Boolean(planeReady && hasMappedPose);
    });

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

    function applyLocalPose(parentNode, yRot = 0) {
      modelRoot.parent             = parentNode;
      modelRoot.position           = new Vector3(0, modelYOffset + SURFACE_FLOAT, 0);
      modelRoot.rotationQuaternion = null;
      modelRoot.rotation           = new Vector3(0, yRot, 0);
      modelRoot.scaling            = new Vector3(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
    }

    function placeModel(surfacePose) {
      if (!modelRoot) {
        console.warn("Model not loaded yet");
        return;
      }
      const { pos, rot, yRot = 0 } = surfacePose;

      placementNode?.dispose();
      placementNode = new TransformNode("placement", scene);
      placementNode.position = pos.clone();
      placementNode.rotationQuaternion = rot ? rot.clone() : Quaternion.Identity();
      applyLocalPose(placementNode, yRot);
      showModel();

      shadowCatcher.position.copyFrom(pos);
      shadowCatcher.position.y += 0.001;
      shadowCatcher.rotationQuaternion = rot ? rot.clone() : Quaternion.Identity();
      shadowCatcher.isVisible  = true;
      isPlaced               = true;
      reticle.isVisible      = false;
      surfacePlane.isVisible = false;
      setSurfaceReady(false);
    }

    function handleSelect() {
      if (isPlaced || !modelRoot) return;
      const p = getCameraPointOnSurface();
      placeModel({ pos: p, rot: reticle.rotationQuaternion?.clone() ?? Quaternion.Identity(), yRot: 0 });
    }

    window.resetAR = () => {
      if (modelRoot) {
        modelRoot.parent = null;
        modelRoot.setEnabled(false);
      }
      placementNode?.dispose();
      placementNode = null;
      shadowCatcher.isVisible = false;
      isPlaced = false;
      stableCount = 0;
      stableBuffer = [];
      planeReady = false;
      hasPlanePose = false;
      hasMappedPose = false;
      mappedPlaneScale = 1;
      targetMappedPlaneScale = 1;
      _targetPlanePos.set(0, 0, 0);
      _targetPlaneRot.copyFrom(Quaternion.Identity());
      _mappedPlanePos.set(0, 0, 0);
      _mappedPlaneRot.copyFrom(Quaternion.Identity());
      reticle.isVisible = false;
      surfacePlane.isVisible = false;
      surfacePlane.scaling.set(1, 1, 1);
      setSurfaceReady(planeReady);
    };

    scene.createDefaultXRExperienceAsync({
      uiOptions: { sessionMode: "immersive-ar", referenceSpaceType: "local" },
      optionalFeatures: ["hit-test", "light-estimation", "dom-overlay"],
      disableDefaultUI: true,
      disableTeleportation: true,
    }).then((xr) => {
      xrHelperRef.current = xr;
      const fm = xr.baseExperience.featuresManager;

      try {
        fm.enableFeature(WebXRFeatureName.DOM_OVERLAY, "latest", { element: overlayRef.current });
      } catch {
        // DOM overlay is optional.
      }

      try {
        fm.enableFeature(WebXRFeatureName.LIGHT_ESTIMATION, "latest", {
          createDefaultLight: true,
          reflectionFormat: "srgba8",
        });
      } catch {
        // Light estimation is optional.
      }

      let hitTest;
      try {
        hitTest = fm.enableFeature(WebXRFeatureName.HIT_TEST, "latest", {
          entityTypes: ["plane"],
        });
      } catch {
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
          const rot = new Quaternion();
          hit.transformationMatrix.decompose(undefined, rot, pos);
          if (isPositionStable(pos)) stableCount = Math.min(stableCount + 1, STABLE_FRAMES_REQ + 1);
          else stableCount = 0;
          _targetPlanePos.copyFrom(pos);
          _targetPlaneRot.copyFrom(rot);
          if (!hasPlanePose) {
            reticle.position.copyFrom(pos);
            reticle.rotationQuaternion?.copyFrom(rot);
            hasPlanePose = true;
          }
          if (!hasMappedPose || stableCount >= STABLE_FRAMES_REQ) {
            _mappedPlanePos.copyFrom(_targetPlanePos);
            _mappedPlaneRot.copyFrom(_targetPlaneRot);
            if (!hasMappedPose) {
              surfacePlane.position.copyFrom(_mappedPlanePos);
              surfacePlane.rotationQuaternion = surfacePlane.rotationQuaternion || Quaternion.Identity();
              surfacePlane.rotationQuaternion.copyFrom(_mappedPlaneRot);
              hasMappedPose = true;
            }
          }
          planeReady = true;
          setSurfaceReady(true);
          if (stableCount >= STABLE_FRAMES_REQ) {
            planeReady = true;
            setSurfaceReady(true);
          }
        } else {
          stableCount = 0;
          stableBuffer = [];
          surfacePlane.isVisible = false;
        }
      });

      xr.baseExperience.onStateChangedObservable.add((state) => {
        if (state === WebXRState.IN_XR) {
          setInSession(true);
          xrCamera = xr.baseExperience.camera;
          planeReady = false;
          setSurfaceReady(false);
          const session = xr.baseExperience.sessionManager.session;
          const onSel = () => handleSelect();
          session.addEventListener("select", onSel);
          selectCleanup = () => session.removeEventListener("select", onSel);
        } else {
          setInSession(false);
          xrCamera = null;
          window.resetAR();
          if (selectCleanup) {
            selectCleanup();
            selectCleanup = null;
          }
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
