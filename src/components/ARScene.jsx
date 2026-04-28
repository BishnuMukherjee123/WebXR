import { useEffect, useRef } from "react";
import * as THREE from "three";

import { createRenderer } from "../three/renderer";
import { createScene } from "../three/scene";
import { createReticle } from "../three/reticle";
import { startXRSession } from "../xr/session";
import { setupHitTest } from "../xr/hitTest";
import { loadGLB } from "../three/loaders";

export default function ARScene() {
  const containerRef = useRef();

  useEffect(() => {
    let renderer, scene, camera;
    let hitTestSource = null;
    let session = null;
    let reticle;
    let controller;
    let placedObjects = [];
    let preloadedModel = null; // ✅ cached — loaded once, cloned on each tap

    const init = async () => {
      console.log("🔍 ARScene init starting...");

      // 🧠 Check WebXR support
      if (!navigator.xr) {
        console.error("❌ navigator.xr not available");
        alert("WebXR not supported on this browser");
        return;
      }

      console.log("✅ navigator.xr exists");

      try {
        const supported = await navigator.xr.isSessionSupported("immersive-ar");
        console.log("AR support check:", supported);

        if (!supported) {
          alert("AR not supported on this device");
          return;
        }
      } catch (err) {
        console.error("❌ Error checking AR support:", err);
      }

      // 🎬 Scene + camera
      scene = createScene();

      camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );

      renderer = createRenderer(containerRef.current);

      // 🎯 Reticle
      reticle = createReticle();
      scene.add(reticle);

      // 📦 Preload GLB once — tap placement is then instant
      try {
        console.log("📦 Preloading GLB model...");
        preloadedModel = await loadGLB("/models/10.glb");
        console.log("✅ GLB preloaded");
      } catch (err) {
        console.error("❌ GLB preload failed:", err);
      }

      // 🎮 Controller (handles tap / select)
      controller = renderer.xr.getController(0);

      controller.addEventListener("select", () => {
        if (!reticle.visible) return;

        if (!preloadedModel) {
          console.warn("⚠️ Model not yet loaded, try again");
          return;
        }

        // Clone the preloaded scene so multiple copies can be placed
        const model = preloadedModel.clone();

        model.position.setFromMatrixPosition(reticle.matrix);
        model.quaternion.setFromRotationMatrix(reticle.matrix);
        model.scale.set(0.3, 0.3, 0.3);

        scene.add(model);
        placedObjects.push(model);
        console.log("✅ Model placed at", model.position);
      });

      scene.add(controller);

      // 🚀 Start AR — triggered by UI button
      window.startAR = async () => {
        if (session) {
          console.log("⚠️ AR session already running");
          return;
        }

        try {
          console.log("🚀 Requesting AR session...");
          session = await startXRSession(renderer);
          console.log("✅ XR session started", session);

          hitTestSource = await setupHitTest(session);
          console.log("✅ hit-test source ready");

          session.addEventListener("end", () => {
            console.log("⛔ XR session ended");
            session = null;
            hitTestSource = null;
          });
        } catch (err) {
          console.error("❌ AR start failed:", err);
          alert("AR Error: " + err.message);
        }
      };

      // 🔄 Clear all placed objects
      window.resetAR = () => {
        placedObjects.forEach((obj) => scene.remove(obj));
        placedObjects = [];
      };

      // 🔁 Animation / render loop
      renderer.setAnimationLoop((time, frame) => {
        if (frame && hitTestSource && session) {
          try {
            const referenceSpace = renderer.xr.getReferenceSpace();
            const hits = frame.getHitTestResults(hitTestSource);

            if (hits.length > 0) {
              const pose = hits[0].getPose(referenceSpace);
              reticle.visible = true;
              reticle.matrix.fromArray(pose.transform.matrix);
            } else {
              reticle.visible = false;
            }
          } catch (err) {
            console.error("❌ Hit test error:", err);
          }
        }

        renderer.render(scene, camera);
      });
    };

    init();

    return () => {
      if (renderer) {
        renderer.setAnimationLoop(null);
        renderer.dispose();
      }
    };
  }, []);

  return <div ref={containerRef} />;
}