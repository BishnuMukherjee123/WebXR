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

    useEffect(() => {
        let renderer, scene, camera;
        let hitTestSource = null;
        let reticle;

        let controller;
        let placedObjects = [];

        scene = createScene();
        camera = new THREE.PerspectiveCamera();

        renderer = createRenderer(ref.current);

        reticle = createReticle();
        scene.add(reticle);

        // Start AR
        document.getElementById("start-ar").onclick = async () => {
            const session = await startXRSession(renderer);
            hitTestSource = await setupHitTest(session);
        };

        document.getElementById("reset-ar").onclick = () => {
            placedObjects.forEach(obj => scene.remove(obj));
            placedObjects = [];
        };

        renderer.setAnimationLoop((time, frame) => {
            if (frame && hitTestSource) {
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
    }, []);

    return <div ref={ref} />;
}