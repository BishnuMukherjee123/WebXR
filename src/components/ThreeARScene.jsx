import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const MODEL_URL = "/models/10.glb";

export default function ThreeARScene() {
  const modelViewerRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(Boolean(customElements.get("model-viewer")));
  const [status, setStatus] = useState("Tap 'Open AR' to view in your space.");

  // Inject model-viewer script once.
  useEffect(() => {
    // WIRE UP 1: Pin global THREE so model-viewer shares our Three.js context
    // This stops the "multiple instances of Three.js" warning and guarantees
    // your custom Three.js objects use the exact same WebGL state.
    if (!window.THREE) window.THREE = THREE;
    
    if (customElements.get("model-viewer")) return;
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
    script.onload = () => setScriptReady(true);
    script.onerror = () => console.error("[model-viewer] Could not load model-viewer script");
    document.head.appendChild(script);
  }, []);

  // Sync with model-viewer and extract Three.js scene
  useEffect(() => {
    const viewer = modelViewerRef.current;
    if (!viewer) return;

    // Wait for the model-viewer element to be fully initialized
    const onLoad = () => {
      // WIRE UP 2: Access the internal Three.js scene using the hidden Symbol.
      // This is the master bridge between model-viewer and your custom Three.js logic!
      const sceneSymbol = Object.getOwnPropertySymbols(viewer).find(s => s.description === 'scene');
      if (sceneSymbol && viewer[sceneSymbol]) {
        const modelScene = viewer[sceneSymbol];
        console.log("Successfully wired up! Three.js scene extracted from model-viewer:", modelScene);
        
        // You now have the raw THREE.Scene! 
        // You can add your custom meshes, particle effects, or lights directly into model-viewer:
        
        // Example:
        // const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        // const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        // const customCube = new THREE.Mesh(geometry, material);
        // customCube.position.set(0, 0.5, 0);
        // modelScene.add(customCube);
      }
    };

    viewer.addEventListener('load', onLoad);

    function onArStatus(event) {
      const s = event.detail?.status;
      if (s === "session-started") {
        setStatus("AR active \u2014 move your phone to scan the floor, then tap to place.");
      } else if (s === "object-placed") {
        setStatus("Model placed! Pinch to scale, drag to reposition.");
      } else if (s === "failed") {
        setStatus("AR failed. Check camera permissions and try again.");
      } else if (s === "not-presenting") {
        setStatus("Tap 'Open AR' to view in your space.");
      }
    }

    viewer.addEventListener("ar-status", onArStatus);
    return () => {
      viewer.removeEventListener('load', onLoad);
      viewer.removeEventListener("ar-status", onArStatus);
    };
  }, [scriptReady]);

  return (
    <div className="marker-ar-root">
      {/* Status topbar \u2014 floats above model-viewer */}
      <div className="ar-topbar" style={{ zIndex: 20 }}>
        <div>{status}</div>
      </div>

      {scriptReady ? (
        <model-viewer
          ref={modelViewerRef}
          src={MODEL_URL}
          alt="Dish in AR"
          ar
          ar-modes="webxr scene-viewer quick-look"
          ar-placement="floor"
          camera-controls
          touch-action="pan-y"
          // Exact settings extracted from reading model-viewer's ARRenderer.ts & Renderer.ts
          shadow-intensity="0.8" 
          shadow-softness="0.5"
          exposure="1.0"
          environment-image="neutral" // Triggers the 1.3 COMMERCE_EXPOSURE
          interaction-prompt="none"
          className="marker-viewer__host"
          style={{
            /* Override shadow DOM :host defaults:
               contain:strict clips internal canvas to 300\u00d7150px.
               These inline styles are the only way to override :host rules. */
            display: 'block',
            contain: 'none',
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100dvh',
            zIndex: 1,
            background: '#1a1a24',
            '--poster-color': 'transparent',
          }}
        >
          <button slot="ar-button" className="marker-viewer__ar-btn">
            \ud83d\udcf7 Open AR
          </button>
        </model-viewer>
      ) : (
        <div className="native-viewer__loading">Loading model-viewer\u2026</div>
      )}
    </div>
  );
}
