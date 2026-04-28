import { useEffect, useRef } from "react";
import * as THREE from "three";
import { clone as skeletonClone } from "three/addons/utils/SkeletonUtils.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export default function ARScene() {
  const containerRef = useRef();

  useEffect(() => {
    const scene = new THREE.Scene();
    let hitTestSource = null;
    let hitTestSourceRequested = false;
    let reticle, controller1, controller2;
    let preloadedModel = null;
    let currentSession = null;

    // ── Lights ────────────────────────────────────────────────────
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
    hemiLight.position.set(0.5, 1, 0.25);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(1, 3, 2);
    scene.add(dirLight);

    // ── Camera ────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(
      70, window.innerWidth / window.innerHeight, 0.01, 20
    );

    // ── Renderer ──────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // transparent so camera feed shows through
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    renderer.xr.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // ── Custom START AR button ────────────────────────────────────
    // We do NOT use Three.js ARButton because it calls navigator.xr.offerSession()
    // which redirects the user OUTSIDE the browser to an external AR viewer.
    // We call navigator.xr.requestSession() directly to keep AR inside Chrome.
    const button = document.createElement("button");
    button.id = "ARButton";
    button.textContent = "START AR";
    Object.assign(button.style, {
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "12px 24px",
      border: "1px solid #fff",
      borderRadius: "4px",
      background: "rgba(0,0,0,0.3)",
      color: "#fff",
      font: "bold 14px sans-serif",
      cursor: "pointer",
      zIndex: "999",
      display: "none",
    });

    async function onSessionStarted(session) {
      session.addEventListener("end", onSessionEnded);
      // Must set reference space type BEFORE setSession
      renderer.xr.setReferenceSpaceType("local");
      await renderer.xr.setSession(session);
      button.textContent = "STOP AR";
      currentSession = session;
    }

    function onSessionEnded() {
      button.textContent = "START AR";
      currentSession = null;
      hitTestSourceRequested = false;
      hitTestSource = null;
    }

    button.addEventListener("click", () => {
      if (!currentSession) {
        // ✅ requestSession stays inside the browser
        // ❌ offerSession (used by ARButton) sends user outside to system AR viewer
        navigator.xr
          .requestSession("immersive-ar", {
            requiredFeatures: ["hit-test"],
            optionalFeatures: ["local-floor"],
          })
          .then(onSessionStarted)
          .catch((e) => console.error("❌ AR session failed:", e));
      } else {
        currentSession.end();
      }
    });

    // Show button only if immersive-ar is supported
    if ("xr" in navigator) {
      navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
        if (supported) {
          button.style.display = "block";
        } else {
          button.textContent = "AR NOT SUPPORTED";
          button.style.cursor = "default";
          button.style.display = "block";
        }
      }).catch(() => {
        button.textContent = "AR NOT AVAILABLE";
        button.style.display = "block";
      });
    } else {
      button.textContent = window.isSecureContext ? "WEBXR NOT AVAILABLE" : "NEEDS HTTPS";
      button.style.display = "block";
    }

    document.body.appendChild(button);

    // ── Reticle ───────────────────────────────────────────────────
    reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // ── Controllers ───────────────────────────────────────────────
    function onSelect() {
      if (!reticle.visible || !preloadedModel) return;
      const model = skeletonClone(preloadedModel);
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

    controller1 = renderer.xr.getController(0);
    controller1.addEventListener("select", onSelect);
    scene.add(controller1);

    controller2 = renderer.xr.getController(1);
    controller2.addEventListener("select", onSelect);
    scene.add(controller2);

    // ── Preload GLB ───────────────────────────────────────────────
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

    // ── Resize ────────────────────────────────────────────────────
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onWindowResize);

    // ── Animation loop ────────────────────────────────────────────
    function animate(timestamp, frame) {
      if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if (!hitTestSourceRequested) {
          session.requestReferenceSpace("viewer").then((vs) => {
            session.requestHitTestSource({ space: vs }).then((src) => {
              hitTestSource = src;
            });
          });
          session.addEventListener("end", () => {
            hitTestSourceRequested = false;
            hitTestSource = null;
          });
          hitTestSourceRequested = true;
        }

        if (hitTestSource) {
          const results = frame.getHitTestResults(hitTestSource);
          if (results.length > 0) {
            reticle.visible = true;
            reticle.matrix.fromArray(
              results[0].getPose(referenceSpace).transform.matrix
            );
          } else {
            reticle.visible = false;
          }
        }
      }
      renderer.render(scene, camera);
    }

    renderer.setAnimationLoop(animate);

    // ── Reset ─────────────────────────────────────────────────────
    window.resetAR = () => {
      const keep = new Set([reticle, controller1, controller2, hemiLight, dirLight]);
      [...scene.children].filter((o) => !keep.has(o)).forEach((o) => scene.remove(o));
    };

    // ── Cleanup ───────────────────────────────────────────────────
    return () => {
      window.removeEventListener("resize", onWindowResize);
      renderer.setAnimationLoop(null);
      renderer.dispose();
      button.remove();
    };
  }, []);

  return <div ref={containerRef} style={{ position: "fixed", inset: 0 }} />;
}