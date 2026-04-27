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

    const init = async () => {
      // 🧠 Check support
      if (!navigator.xr) {
        alert("WebXR not supported");
        return;
      }

      const supported = await navigator.xr.isSessionSupported("immersive-ar");
      if (!supported) {
        alert("AR not supported on this device");
        return;
      }

      // 🎬 Scene setup
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

      // 🎮 Controller (tap)
      controller = renderer.xr.getController(0);

      controller.addEventListener("select", async () => {
        if (!reticle.visible) return;

        try {
          const model = await loadGLB("/models/10.glb");

          // Position
          model.position.setFromMatrixPosition(reticle.matrix);

          // Rotation
          model.quaternion.setFromRotationMatrix(reticle.matrix);

          // Scale
          model.scale.set(0.3, 0.3, 0.3);

          scene.add(model);
          placedObjects.push(model);
        } catch (err) {
          console.error("❌ GLB load failed:", err);
        }
      });

      scene.add(controller);

      // 🚀 Expose start function globally (for React button)
      window.startAR = async () => {
        try {
          session = await startXRSession(renderer);
          console.log("✅ XR session started");

          hitTestSource = await setupHitTest(session);
          console.log("✅ hit-test ready");
        } catch (err) {
          console.error("❌ AR start failed:", err);
          alert(err.message);
        }
      };

      // 🔄 Reset function
      window.resetAR = () => {
        placedObjects.forEach((obj) => scene.remove(obj));
        placedObjects = [];
      };

      // 🔁 Render loop
      renderer.setAnimationLoop((time, frame) => {
        if (frame && hitTestSource && session) {
          const referenceSpace = renderer.xr.getReferenceSpace();
          const hits = frame.getHitTestResults(hitTestSource);

          if (hits.length > 0) {
            const pose = hits[0].getPose(referenceSpace);

            reticle.visible = true;
            reticle.matrix.fromArray(pose.transform.matrix);
          } else {
            reticle.visible = false;
          }
        }

        renderer.render(scene, camera);
      });
    };

    init();

    return () => {
      if (renderer) renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} />;
}