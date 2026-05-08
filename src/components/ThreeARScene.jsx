import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const MODELS = [
  { name: 'Bong Kebab', glb: '/models/10.glb', webp: 'https://via.placeholder.com/100?text=Bong+Kebab' }, // User's custom GLB
  { name: 'Chair', glb: '../../assets/ShopifyModels/Chair.glb', webp: '../../assets/ShopifyModels/Chair.webp' },
  { name: 'Mixer', glb: '../../assets/ShopifyModels/Mixer.glb', webp: '../../assets/ShopifyModels/Mixer.webp' },
  { name: 'GeoPlanter', glb: '../../assets/ShopifyModels/GeoPlanter.glb', webp: '../../assets/ShopifyModels/GeoPlanter.webp' },
  { name: 'ToyTrain', glb: '../../assets/ShopifyModels/ToyTrain.glb', webp: '../../assets/ShopifyModels/ToyTrain.webp' },
  { name: 'Canoe', glb: '../../assets/ShopifyModels/Canoe.glb', webp: '../../assets/ShopifyModels/Canoe.webp' }
];

export default function ThreeARScene() {
  const modelViewerRef = useRef(null);
  const sliderRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(Boolean(customElements.get("model-viewer")));
  const [currentModel, setCurrentModel] = useState(MODELS[0]);

  // Inject model-viewer script once.
  useEffect(() => {
    // WIRE UP 1: Pin global THREE so model-viewer shares our Three.js context
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

    const onLoad = () => {
      // WIRE UP 2: Access the internal Three.js scene using the hidden Symbol.
      const sceneSymbol = Object.getOwnPropertySymbols(viewer).find(s => s.description === 'scene');
      if (sceneSymbol && viewer[sceneSymbol]) {
        const modelScene = viewer[sceneSymbol];
        console.log("Successfully wired up! Three.js scene extracted from model-viewer:", modelScene);
        // Custom Three.js objects can be added to modelScene here
      }
    };

    viewer.addEventListener('load', onLoad);
    return () => viewer.removeEventListener('load', onLoad);
  }, [scriptReady, currentModel]);

  // Handle beforexrselect for the slider
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const preventXr = (ev) => {
      // Keep slider interactions from affecting the XR scene.
      ev.preventDefault();
    };

    slider.addEventListener('beforexrselect', preventXr);
    return () => slider.removeEventListener('beforexrselect', preventXr);
  }, [scriptReady]);

  return (
    <div className="marker-ar-root">
      {scriptReady ? (
        <model-viewer
          ref={modelViewerRef}
          src={currentModel.glb}
          poster={currentModel.webp}
          shadow-intensity="1"
          ar
          camera-controls
          touch-action="pan-y"
          alt="A 3D model carousel"
          className="marker-viewer__host"
        >
          <button slot="ar-button" id="ar-button">
            View in your space
          </button>

          <div id="ar-prompt">
            <img src="../../assets/hand.png" alt="Hand Prompt" />
          </div>

          <button id="ar-failure">
            AR is not tracking!
          </button>

          <div className="slider" ref={sliderRef}>
            <div className="slides">
              {MODELS.map((model) => (
                <button
                  key={model.name}
                  className={`slide ${currentModel.name === model.name ? 'selected' : ''}`}
                  onClick={() => setCurrentModel(model)}
                  style={{ backgroundImage: `url('${model.webp}')` }}
                />
              ))}
            </div>
          </div>
        </model-viewer>
      ) : (
        <div className="native-viewer__loading">Loading model-viewer\u2026</div>
      )}
    </div>
  );
}
