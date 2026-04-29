import { useEffect, useRef, useState } from "react";
import AROverlay from "./AROverlay";
import ARLanding from "./ARLanding";

// Import the custom A-Frame component registration.
// It runs immediately and calls AFRAME.registerComponent().
// A-Frame (loaded via CDN in index.html) is guaranteed to be on window by now.
import "../ar-placement.js";

const MODEL_URL = "https://iskchovltfnohyftjckg.supabase.co/storage/v1/object/public/models/10.glb";

/**
 * ARScene
 *
 * Renders an A-Frame scene as JSX custom elements.
 * React passes these through as-is because they are browser-registered
 * custom elements (registered by A-Frame's CDN script in index.html).
 *
 * DOM Overlay root (#ar-overlay) is ALWAYS in the DOM so the XR session
 * can reference it before and during the session.
 */
export default function ARScene() {
  const overlayRef    = useRef(null);
  const [inSession,    setInSession]    = useState(false);
  const [surfaceReady, setSurfaceReady] = useState(false);

  // ── Listen to A-Frame → React events ──────────────────────────────────
  useEffect(() => {
    const onStart   = ()  => setInSession(true);
    const onEnd     = ()  => { setInSession(false); setSurfaceReady(false); };
    const onSurface = (e) => setSurfaceReady(!!e.detail);
    const onReset   = ()  => setSurfaceReady(false);

    window.addEventListener("ar:sessionstart", onStart);
    window.addEventListener("ar:sessionend",   onEnd);
    window.addEventListener("ar:surface",      onSurface);
    window.addEventListener("ar:reset",        onReset);
    return () => {
      window.removeEventListener("ar:sessionstart", onStart);
      window.removeEventListener("ar:sessionend",   onEnd);
      window.removeEventListener("ar:surface",      onSurface);
      window.removeEventListener("ar:reset",        onReset);
    };
  }, []);

  // ── Wire DOM overlay element into the a-scene after mount ─────────────
  useEffect(() => {
    const scene = document.querySelector("a-scene");
    if (scene && overlayRef.current) {
      // Inject overlay element reference for the WebXR session init.
      // A-Frame 1.6 reads overlayElement from the webxr component data.
      scene.setAttribute(
        "webxr",
        `requiredFeatures: hit-test; optionalFeatures: dom-overlay, light-estimation; overlayElement: #ar-overlay`
      );
    }
  }, []);

  return (
    <>
      {/*
        DOM Overlay root — ALWAYS in DOM, never conditionally rendered.
        WebXR spec requires this element to exist before the session starts.
        id="ar-overlay" is referenced by the webxr component above.
      */}
      <div
        ref={overlayRef}
        id="ar-overlay"
        style={{
          position: "fixed", inset: 0,
          zIndex: 10,
          pointerEvents: "none", // non-UI areas pass taps to XR canvas
        }}
      >
        {inSession && (
          <AROverlay surfaceReady={surfaceReady} />
        )}
      </div>

      {/*
        A-Frame Scene
        ─────────────
        • webxr attribute requests hit-test + optional dom-overlay features
        • vr-mode-ui="enabled:false" hides A-Frame's default VR headset button
        • embedded prevents A-Frame from going fullscreen on its own
        • ar-placement is our custom component (registered in ar-placement.js)
      */}
      <a-scene
        webxr="requiredFeatures: hit-test; optionalFeatures: dom-overlay, light-estimation"
        renderer="antialias: true; alpha: true; colorManagement: true; physicallyCorrectLights: true"
        background="transparent: true"
        vr-mode-ui="enabled: false"
        embedded
        ar-placement
      >
        {/* Reticle ring — shown while scanning for a surface */}
        <a-torus
          id="ar-reticle"
          radius="0.18"
          radius-tubular="0.012"
          segments-tubular="64"
          rotation="-90 0 0"
          material="color: white; shader: flat; opacity: 0.85"
          visible="false"
        />

        {/* The GLB 3D model — hidden until placed */}
        <a-entity
          id="ar-model"
          gltf-model={MODEL_URL}
          scale="3 3 3"
          visible="false"
          shadow="cast: true; receive: false"
        />

        {/* Invisible shadow-catching ground plane */}
        <a-plane
          id="ar-shadow-plane"
          rotation="-90 0 0"
          width="10"
          height="10"
          material="transparent: true; opacity: 0; src: none"
          shadow="cast: false; receive: true"
          visible="false"
        />

        {/* Lighting */}
        <a-light type="ambient"      color="#ffffff" intensity="0.6" />
        <a-light
          type="directional"
          color="#ffffff"
          intensity="1.0"
          position="-1 3 -1"
          shadow="cast: true; shadowMapWidth: 1024; shadowMapHeight: 1024; shadowBias: -0.001"
        />

        {/* Asset preloading */}
        <a-assets>
          <a-asset-item id="glb-model" src={MODEL_URL} />
        </a-assets>
      </a-scene>

      {/* Landing screen shown before session */}
      {!inSession && <ARLanding />}
    </>
  );
}