import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ARButton } from "three/addons/webxr/ARButton.js";
import { clone as skeletonClone } from "three/addons/utils/SkeletonUtils.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default function ARScene() {
  const containerRef = useRef();

  useEffect(() => {
    // ─────────────────────────────────────────────────────────────
    // Follows the official Three.js webxr_ar_hittest.html example
    // exactly — nothing more, nothing less — to guarantee the camera
    // passthrough works before adding GLB on top.
    // ─────────────────────────────────────────────────────────────

    const scene = new THREE.Scene();

    // Camera — same near/far as official example
    const camera = new THREE.PerspectiveCamera(
      70, window.innerWidth / window.innerHeight, 0.01, 20
    );

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
    hemiLight.position.set(0.5, 1, 0.25);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(1, 3, 2);
    scene.add(dirLight);

    // Renderer — EXACT copy from official example: only antialias + alpha
    // No setClearColor, no premultipliedAlpha — the official example
    // does not need these and they can interfere with the compositor.
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Only additions for correct GLB/PBR rendering:
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    renderer.xr.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // ARButton — EXACT copy from official example:
    // No domOverlay, no optionalFeatures — just hit-test.
    // ARButton creates its own minimal transparent overlay internally.
    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test"],
    });
    document.body.appendChild(arButton);

    // Hit-test state
    let hitTestSource = null;
    let hitTestSourceRequested = false;

    // Reticle — exact copy from official example
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // Controllers — exact copy from official example
    let preloadedModel = null;

    function onSelect() {
      if (!reticle.visible) return;
      if (!preloadedModel) return;

      const model = skeletonClone(preloadedModel);
      // Official pattern: decompose reticle matrix into model transform
      reticle.matrix.decompose(model.position, model.quaternion, model.scale);
      model.scale.set(0.3, 0.3, 0.3);
      model.traverse((child) => {
        if (child.isMesh) {
          child.visible = true;
          child.frustumCulled = false;
          if (child.material) child.material.needsUpdate = true;
        }
      });
      scene.add(model);
    }

    const controller1 = renderer.xr.getController(0);
    controller1.addEventListener("select", onSelect);
    scene.add(controller1);

    const controller2 = renderer.xr.getController(1);
    controller2.addEventListener("select", onSelect);
    scene.add(controller2);

    // Preload GLB
    new GLTFLoader().load(
      "/models/10.glb",
      (gltf) => {
        preloadedModel = gltf.scene;
        preloadedModel.traverse((child) => {
          if (child.isMesh) {
            child.frustumCulled = false;
            if (child.material) child.material.needsUpdate = true;
          }
        });
        console.log("✅ GLB loaded");
      },
      undefined,
      (err) => console.error("❌ GLB error:", err)
    );

    // Resize
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onWindowResize);

    // Animation loop — exact copy from official example
    function animate(timestamp, frame) {
      if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if (!hitTestSourceRequested) {
          session.requestReferenceSpace("viewer").then((viewerSpace) => {
            session.requestHitTestSource({ space: viewerSpace }).then((source) => {
              hitTestSource = source;
            });
          });

          session.addEventListener("end", () => {
            hitTestSourceRequested = false;
            hitTestSource = null;
          });

          hitTestSourceRequested = true;
        }

        if (hitTestSource) {
          const hitTestResults = frame.getHitTestResults(hitTestSource);
          if (hitTestResults.length) {
            const hit = hitTestResults[0];
            reticle.visible = true;
            reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
          } else {
            reticle.visible = false;
          }
        }
      }

      renderer.render(scene, camera);
    }

    renderer.setAnimationLoop(animate);

    // Reset (called from UIOverlay)
    window.resetAR = () => {
      const keep = new Set([reticle, controller1, controller2, hemiLight, dirLight]);
      [...scene.children]
        .filter((o) => !keep.has(o))
        .forEach((o) => scene.remove(o));
    };

    return () => {
      window.removeEventListener("resize", onWindowResize);
      renderer.setAnimationLoop(null);
      renderer.dispose();
      arButton.remove();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ position: "fixed", inset: 0 }} />
  );
}