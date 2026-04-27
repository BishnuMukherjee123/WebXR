import { useEffect, useRef } from "react";
import * as THREE from "three";

import { createRenderer } from "../three/renderer";
import { createScene } from "../three/scene";
import { createReticle } from "../three/reticle";
import { startXRSession } from "../xr/session";
import { setupHitTest } from "../xr/hitTest";
import { loadGLB } from "../three/loaders";

export default function ARScene() {
    const ref = useRef();
    const uiRef = useRef();

    useEffect(() => {
        let renderer, scene, camera;
        let hitTestSource = null;
        let reticle;
        let session = null;
        let controller;
        let placedObjects = [];

        const init = async () => {
            // Check XR support
            if (!navigator.xr) {
                alert("WebXR not supported on this device");
                return;
            }

            const supported = await navigator.xr.isSessionSupported("immersive-ar");
            if (!supported) {
                alert("AR not supported on this device");
                return;
            }

            scene = createScene();
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

            renderer = createRenderer(ref.current);

            reticle = createReticle();
            scene.add(reticle);

            // Setup controller
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
                    console.error("Failed to load/place model:", err);
                }
            });
            scene.add(controller);

            // Start AR button
            const startBtn = document.getElementById("start-ar");
            if (startBtn) {
                startBtn.onclick = async () => {
                    try {
                        session = await startXRSession(renderer);
                        console.log("✅ XR Session started");
                        hitTestSource = await setupHitTest(session);
                        console.log("✅ Hit test initialized");
                        startBtn.textContent = "AR Running...";
                        startBtn.disabled = true;
                    } catch (err) {
                        console.error("❌ Failed to start AR:", err);
                        alert("AR session failed: " + err.message);
                    }
                };
            }

            // Reset button
            const resetBtn = document.getElementById("reset-ar");
            if (resetBtn) {
                resetBtn.onclick = () => {
                    placedObjects.forEach(obj => scene.remove(obj));
                    placedObjects = [];
                };
            }

            // Animation loop
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

        init().catch(err => console.error("Init error:", err));

        return () => {
            // Cleanup
            if (renderer) {
                renderer.dispose();
            }
        };
    }, []);

    return <div ref={ref} />;
}