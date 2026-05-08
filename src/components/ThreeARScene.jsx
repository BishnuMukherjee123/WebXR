import React, { useEffect, useRef, useState } from "react";
import "@google/model-viewer";

const MODELS = [
  { name: 'Bong Kebab', glb: '/models/10.glb', webp: '' },
  { name: 'Chair', glb: '../../assets/ShopifyModels/Chair.glb', webp: '../../assets/ShopifyModels/Chair.webp' },
  { name: 'Mixer', glb: '../../assets/ShopifyModels/Mixer.glb', webp: '../../assets/ShopifyModels/Mixer.webp' },
  { name: 'GeoPlanter', glb: '../../assets/ShopifyModels/GeoPlanter.glb', webp: '../../assets/ShopifyModels/GeoPlanter.webp' },
  { name: 'ToyTrain', glb: '../../assets/ShopifyModels/ToyTrain.glb', webp: '../../assets/ShopifyModels/ToyTrain.webp' },
  { name: 'Canoe', glb: '../../assets/ShopifyModels/Canoe.glb', webp: '../../assets/ShopifyModels/Canoe.webp' }
];

export default function ThreeARScene() {
  const modelViewerRef = useRef(null);
  const sliderRef = useRef(null);
  const [currentModel, setCurrentModel] = useState(MODELS[0]);
  const [arStatus, setArStatus] = useState("Tap 'Start Surface AR' to open camera.");
  const [placementMode, setPlacementMode] = useState("floor");

  useEffect(() => {
    // Force model-viewer to use the local draco decoders just in case the CDN is blocked
    window.ModelViewerElement = window.ModelViewerElement || {};
    window.ModelViewerElement.dracoDecoderLocation = '/draco/gltf/';

    const viewer = modelViewerRef.current;
    if (!viewer) return;

    const handleArStatus = (event) => {
      const status = event.detail.status;
      if (status === 'session-started') {
        setArStatus("AR active. Scan the area and tap to place.");
      } else if (status === 'object-placed') {
        setArStatus("Model placed! Pinch to scale or drag to move.");
      } else if (status === 'failed') {
        setArStatus("WebXR failed. Device might not support it.");
      } else if (status === 'not-presenting') {
        setArStatus("Tap 'Start Surface AR' to open camera.");
      }
    };

    viewer.addEventListener('ar-status', handleArStatus);

    return () => {
      viewer.removeEventListener('ar-status', handleArStatus);
    };
  }, []);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;

    const preventXrInteraction = (ev) => {
      ev.preventDefault();
    };

    slider.addEventListener('beforexrselect', preventXrInteraction);

    return () => {
      slider.removeEventListener('beforexrselect', preventXrInteraction);
    };
  }, []);

  return (
    <div className="marker-ar-root" style={{ width: '100vw', height: '100dvh', position: 'relative', overflow: 'hidden' }}>
      
      <div className="ar-topbar" style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', zIndex: 12, textAlign: 'center', pointerEvents: 'none' }}>
        <div style={{ display: 'inline-block', padding: '8px 16px', background: 'rgba(0,0,0,0.7)', color: '#fff', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', backdropFilter: 'blur(10px)' }}>
          {arStatus}
        </div>
      </div>

      <model-viewer
        ref={modelViewerRef}
        src={currentModel.glb}
        poster={currentModel.webp ? currentModel.webp : undefined}
        alt="A 3D model in AR"
        ar="true"
        ar-modes="webxr scene-viewer quick-look"
        ar-placement={placementMode}
        camera-controls="true"
        auto-rotate="true"
        touch-action="none"
        shadow-intensity="1"
        environment-image="neutral"
        style={{ width: '100%', height: '100%', display: 'block', backgroundColor: '#eee' }}
      >
        <button slot="ar-button" id="ar-button" style={{
          position: 'absolute',
          bottom: '132px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 24px',
          background: '#fff',
          color: '#4285f4',
          border: '1px solid #DADCE0',
          borderRadius: '24px',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          cursor: 'pointer'
        }}>
          View in your space
        </button>

        <div id="ar-prompt" style={{ display: 'none' }}>
          <img src="../../assets/hand.png" alt="Hand prompt" />
        </div>

        <button id="ar-failure" style={{ display: 'none' }}>
          AR is not tracking!
        </button>

        <div style={{ position: 'absolute', top: '70px', right: '16px', pointerEvents: 'auto' }}>
          <button 
            onClick={() => setPlacementMode(prev => prev === 'floor' ? 'wall' : 'floor')}
            style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', fontWeight: 'bold' }}
          >
            Mode: {placementMode === 'floor' ? 'Floor' : 'Wall'}
          </button>
        </div>

        <div className="slider" ref={sliderRef} style={{
          position: 'absolute',
          bottom: '16px',
          width: '100%',
          overflow: 'hidden',
          textAlign: 'center',
          pointerEvents: 'auto'
        }}>
          <div className="slides" style={{
            display: 'flex',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            padding: '0 16px'
          }}>
            {MODELS.map((model) => (
              <button
                key={model.name}
                className={`slide ${currentModel.name === model.name ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentModel(model);
                }}
                style={{
                  scrollSnapAlign: 'start',
                  flexShrink: 0,
                  width: '100px',
                  height: '100px',
                  marginRight: '10px',
                  borderRadius: '10px',
                  border: currentModel.name === model.name ? '2px solid #4285f4' : 'none',
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundColor: '#fff',
                  backgroundImage: model.webp ? `url('${model.webp}')` : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}
              >
                {!model.webp && model.name}
              </button>
            ))}
          </div>
        </div>
      </model-viewer>
    </div>
  );
}
