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
  TransformNode,
  Quaternion,
  PointerEventTypes,
  MeshBuilder,
  StandardMaterial,
  Color3
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";

const MODEL_URL = "https://iskchovltfnohyftjckg.supabase.co/storage/v1/object/public/models/10.glb";

export default function ARScene() {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [inSession, setInSession] = useState(false);
  const xrHelperRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Setup Babylon Engine ───────────────────────────────────────────
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new Scene(engine);
    
    // Transparent background for AR pass-through
    scene.clearColor = new Color4(0, 0, 0, 0);

    const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
    hemiLight.intensity = 1.0;

    const dirLight = new DirectionalLight("dirLight", new Vector3(0, -1, -0.5), scene);
    dirLight.intensity = 0.8;

    let modelRoot = null;
    let anchorRoot = null;
    let placedAnchor = null;
    let lastHitTest = null;
    let isPlacing = false;

    // ── Load GLB Model ───────────────────────────────────────────────
    SceneLoader.ImportMeshAsync("", MODEL_URL, "", scene).then((result) => {
      modelRoot = result.meshes[0];
      modelRoot.setEnabled(false);
      
      // Babylon has a built-in function to perfectly center geometry and remove offsets
      modelRoot.normalizeToUnitCube();
      
      // normalizeToUnitCube makes the largest dimension exactly 1 unit (1 meter).
      // Scale it down to realistic real-world size (approx 35cm)
      modelRoot.scaling.scaleInPlace(0.35);
      
      // normalizeToUnitCube centers the model at Y=0 based on its bounding box.
      // To make the bottom of the plate touch the floor, we shift it up by half its scaled height.
      // Wait, normalizeToUnitCube sets the `position` of the root. 
      // If we shift it, we must add to its current position!
      modelRoot.position.y += (0.5 * 0.35);
      
      console.log("✅ Babylon GLB Loaded");
    }).catch(console.error);

    // ── Setup WebXR Default Experience ───────────────────────────────
    scene.createDefaultXRExperienceAsync({
      uiOptions: {
        sessionMode: "immersive-ar",
        referenceSpaceType: "local-floor"
      },
      optionalFeatures: true,
      disableDefaultUI: true, // We use our own React UI to launch AR
      disableTeleportation: true, // Removes the green expanding/shrinking circle
      disablePointerSelection: true // Removes VR laser pointers
    }).then((xr) => {
      xrHelperRef.current = xr;
      const featuresManager = xr.baseExperience.featuresManager;

      // 1. Enable DOM Overlay for custom UI
      featuresManager.enableFeature(WebXRFeatureName.DOM_OVERLAY, "latest", {
        element: overlayRef.current
      });

      // 2. Enable Hit Testing
      const hitTest = featuresManager.enableFeature(WebXRFeatureName.HIT_TEST, "latest");

      // 3. Enable Native Anchors (Crucial for 0 drift)
      const anchorSystem = featuresManager.enableFeature(WebXRFeatureName.ANCHOR_SYSTEM, "latest");

      xr.baseExperience.onStateChangedObservable.add((state) => {
        setInSession(state === WebXRState.IN_XR);
      });

      // Track the latest hit test silently
      const reticle = MeshBuilder.CreateTorus("reticle", { diameter: 0.15, thickness: 0.015, tessellation: 32 }, scene);
      reticle.isVisible = false;
      
      const reticleMat = new StandardMaterial("reticleMat", scene);
      reticleMat.emissiveColor = new Color3(1, 1, 1);
      reticleMat.disableLighting = true;
      reticleMat.alpha = 0.5;
      reticle.material = reticleMat;

      hitTest.onHitTestResultObservable.add((results) => {
        if (results.length > 0) {
          lastHitTest = results[0];
          reticle.isVisible = true;
          
          if (!reticle.rotationQuaternion) {
            reticle.rotationQuaternion = Quaternion.Identity();
          }
          results[0].transformationMatrix.decompose(reticle.scaling, reticle.rotationQuaternion, reticle.position);
        } else {
          lastHitTest = null;
          reticle.isVisible = false;
        }
      });

      // The Babylon way: Attach the node using the anchor added observable
      anchorSystem.onAnchorAddedObservable.add((anchor) => {
        if (!anchorRoot) {
          anchorRoot = new TransformNode("anchorRoot", scene);
          modelRoot.parent = anchorRoot;
        }
        
        // This locks the model tightly to the real-world tracking without manual math
        anchor.attachedNode = anchorRoot;
        
        // Ensure the model shows its front side and doesn't rotate automatically
        if (!modelRoot.rotationQuaternion) {
          modelRoot.rotationQuaternion = Quaternion.Identity();
        } else {
          modelRoot.rotationQuaternion.copyFrom(Quaternion.Identity());
        }

        modelRoot.setEnabled(true);
        console.log("⚓ Babylon Anchor Created and Node Attached");
      });

      // ── Placement Logic (Tap) ──────────────────────────────────────
      scene.onPointerObservable.add(async (pointerInfo) => {
        if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
          if (xr.baseExperience.state !== WebXRState.IN_XR) return;
          if (!modelRoot || isPlacing || !lastHitTest) return;

          isPlacing = true;
          try {
            // Remove previous anchor
            if (placedAnchor) {
              placedAnchor.remove();
              placedAnchor = null;
            }

            // Create new anchor directly from the hardware hit test
            // The observable above handles attaching the node
            placedAnchor = await anchorSystem.addAnchorPointUsingHitTestResultAsync(lastHitTest);
          } catch (e) {
            console.error("⚠️ Anchor placement failed", e);
          } finally {
            isPlacing = false;
          }
        }
      });
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);

    // Provide reset functionality to the React UI
    window.resetAR = () => {
      if (placedAnchor) {
        placedAnchor.remove();
        placedAnchor = null;
      }
      if (modelRoot) {
        modelRoot.setEnabled(false);
      }
      lastHitTest = null;
    };

    return () => {
      window.removeEventListener("resize", onResize);
      engine.dispose();
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          position: "fixed",
          inset: 0,
          outline: "none"
        }}
      />

      {/* dom-overlay root */}
      <div
        ref={overlayRef}
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10 }}
      >
        {inSession && (
          <>
            <div style={{
              position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.5)", color: "#fff", padding: "6px 18px",
              borderRadius: 20, fontSize: 13, fontWeight: 500, whiteSpace: "nowrap",
              backdropFilter: "blur(6px)"
            }}>
              Point at a surface · Tap to place
            </div>
            <button
              onClick={() => window.resetAR?.()}
              style={{
                position: "absolute", top: 16, right: 16, pointerEvents: "auto",
                padding: "8px 18px", background: "rgba(30,30,30,0.85)",
                color: "#fff", border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: "pointer", backdropFilter: "blur(4px)",
              }}
            >
              Reset
            </button>
          </>
        )}
      </div>

      {/* Landing screen */}
      {!inSession && (
        <div style={{
          position: "fixed", inset: 0, background: "#111",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", zIndex: 20
        }}>
          <h1 style={{ color: "#fff", fontSize: 24, marginBottom: 12 }}>Aroma WebXR</h1>
          <p style={{ color: "#aaa", fontSize: 14, marginBottom: 24, textAlign: "center", maxWidth: 300 }}>
            Powered by Babylon.js Native AR Anchors
          </p>
          <button
            onClick={() => {
              if (xrHelperRef.current) {
                xrHelperRef.current.baseExperience.enterXRAsync("immersive-ar", "local-floor").catch(console.error);
              } else {
                alert("AR engine is still loading. Please wait a second.");
              }
            }}
            style={{
              padding: "14px 24px", background: "#fff", color: "#000",
              border: "none", borderRadius: 12, fontSize: 16,
              fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(255,255,255,0.2)"
            }}
          >
            Launch AR Experience
          </button>
        </div>
      )}
    </>
  );
}