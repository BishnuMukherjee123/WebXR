import { useEffect, useRef, useState } from "react";
import {
  Engine, Scene, Vector3, Color4, HemisphericLight, DirectionalLight,
  WebXRFeatureName, WebXRState, Quaternion, TransformNode, MeshBuilder,
  StandardMaterial, Color3, ShadowGenerator, DynamicTexture
} from "@babylonjs/core";
import { ShadowOnlyMaterial } from "@babylonjs/materials"; // Ensure this is installed
import "@babylonjs/loaders/glTF";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";

const MODEL_URL = "https://iskchovltfnohyftjckg.supabase.co/storage/v1/object/public/models/10.glb";
const MODEL_SCALE = 3.0;

export function useAREngine() {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const xrHelperRef = useRef(null);
  const [inSession, setInSession] = useState(false);
  const [surfaceReady, setSurfaceReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new Engine(canvas, true);
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 0);

    // 1. Setup Lighting for Shadows
    const hemiLight = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.5; // Lower base light to let Light Estimation take over

    const dirLight = new DirectionalLight("dir", new Vector3(-1, -2, -1), scene);
    dirLight.position = new Vector3(0, 5, 0);
    dirLight.intensity = 1.0;

    // 2. Shadow Catcher (Ground Plane)
    const shadowPlane = MeshBuilder.CreateGround("shadowPlane", { width: 10, height: 10 }, scene);
    const shadowMat = new ShadowOnlyMaterial("shadowMat", scene);
    shadowPlane.material = shadowMat;
    shadowPlane.receiveShadows = true;
    shadowPlane.isVisible = false; // Only visible once placed

    const shadowGenerator = new ShadowGenerator(1024, dirLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;

    let modelRoot = null;
    let anchorNode = null;
    let isPlaced = false;

    // Load Model
    SceneLoader.ImportMeshAsync("", MODEL_URL, "", scene).then((result) => {
      modelRoot = result.meshes[0];
      modelRoot.scaling = new Vector3(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
      modelRoot.setEnabled(false);
      // Add all child meshes to shadow generator
      result.meshes.forEach(m => shadowGenerator.addShadowCaster(m));
    });

    // 3. WebXR Setup
    scene.createDefaultXRExperienceAsync({
      uiOptions: { sessionMode: "immersive-ar", referenceSpaceType: "local-floor" },
      optionalFeatures: ["hit-test", "anchors", "dom-overlay", "light-estimation"],
      disableDefaultUI: true,
    }).then((xr) => {
      xrHelperRef.current = xr;
      const fm = xr.baseExperience.featuresManager;

      // Enable Light Estimation to match real-world lighting
      fm.enableFeature(WebXRFeatureName.LIGHT_ESTIMATION, "latest", {
        createDefaultLight: true,
        reflectionFormat: "srgba8"
      });

      // Enable Hit Test for placement
      const hitTest = fm.enableFeature(WebXRFeatureName.HIT_TEST, "latest", {
        entityTypes: ["plane"] 
      });

      hitTest.onHitTestResultObservable.add((results) => {
        if (isPlaced) return;
        if (results.length > 0) {
          setSurfaceReady(true);
          const hit = results[0];
          // Use a reticle or visual guide here to follow 'hit.transformationMatrix'
        } else {
          setSurfaceReady(false);
        }
      });

      // Handle Placement
      xr.baseExperience.sessionManager.session.addEventListener("select", () => {
        if (isPlaced || !modelRoot) return;
        
        // Finalize Placement logic
        modelRoot.setEnabled(true);
        shadowPlane.isVisible = true;
        // Snap shadowPlane to the same Y as the hit result
        isPlaced = true;
        setSurfaceReady(false);
      });

      xr.baseExperience.onStateChangedObservable.add((state) => {
        setInSession(state === WebXRState.IN_XR);
      });
    });

    engine.runRenderLoop(() => scene.render());
    return () => engine.dispose();
  }, []);

  return { canvasRef, overlayRef, xrHelperRef, inSession, surfaceReady };
}