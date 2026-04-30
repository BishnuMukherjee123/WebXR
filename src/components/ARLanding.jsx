import { useRef } from "react";

/**
 * ARLanding
 *
 * Pre-session landing screen shown before AR starts.
 * With A-Frame, the session is launched by calling
 * scene.enterAR() directly — no xrHelper ref needed.
 */
export default function ARLanding() {
  const btnRef = useRef(null);

  function launchAR() {
    console.log("[AR] Launch AR button clicked");
    
    // Check HTTPS first
    if (window.location.protocol !== 'https:' && !window.location.hostname.includes('localhost')) {
      console.error("[AR] HTTPS required for WebXR");
      alert("WebXR requires HTTPS. Please access this site via HTTPS.");
      return;
    }
    
    // Check if WebXR is supported
    if (!navigator.xr) {
      console.error("[AR] WebXR not supported on this device/browser");
      alert("WebXR is not supported on this device. Use Chrome on Android with ARCore support.");
      return;
    }

    const scene = document.querySelector("a-scene");
    if (!scene) {
      console.error("[AR] Scene element not found");
      alert("Scene not ready — please wait a moment.");
      return;
    }

    // Wait for scene to be fully loaded
    if (!scene.hasLoaded) {
      console.log("[AR] Waiting for scene to load...");
      scene.addEventListener("loaded", () => launchAR());
      return;
    }

    const renderer = scene.renderer;
    if (!renderer || !renderer.xr) {
      console.error("[AR] Renderer or XR not available yet");
      alert("Scene renderer not ready. Please try again.");
      return;
    }
    
    console.log("[AR] Scene and renderer ready, requesting immersive-ar session...");
    console.log("[AR] Renderer XR capabilities:", {
      enabled: renderer.xr.enabled,
      isPresenting: renderer.xr.isPresenting,
    });
    
    // Request immersive-ar session directly
    navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay', 'light-estimation', 'dom-overlay-for-handheld-ar'],
      domOverlay: { root: document.body }
    })
      .then((session) => {
        console.log("[AR] XR session created:", session);
        console.log("[AR] Session features:", {
          inputSources: session.inputSources,
          mode: session.mode,
          renderState: session.renderState,
        });
        
        // Start the XR session with the renderer
        return renderer.xr.setSession(session)
          .then(() => {
            console.log("[AR] AR session fully initialized with camera access");
          });
      })
      .catch((err) => {
        console.error("[AR] Failed to start AR session:", err);
        console.error("[AR] Error name:", err.name);
        console.error("[AR] Error message:", err.message);
        console.error("[AR] Full error:", err);
        
        let userMessage = "Could not start AR. ";
        if (err.name === "NotSupportedError") {
          userMessage += "WebXR is not supported on this device.";
        } else if (err.name === "NotAllowedError") {
          userMessage += "Camera permission denied. Please allow camera access in your browser settings.";
        } else if (err.name === "SecurityError") {
          userMessage += "This app must run on HTTPS.";
        } else if (err.message?.includes("camera")) {
          userMessage += "Camera access denied or not available.";
        } else {
          userMessage += err.message || "Unknown error";
        }
        
        alert(userMessage);
      });
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 20,
      background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "rgba(255,255,255,0.07)",
        border: "1.5px solid rgba(255,255,255,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 32, marginBottom: 24,
      }}>
        🍽️
      </div>

      <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 700, marginBottom: 10, letterSpacing: -0.5 }}>
        Aroma AR
      </h1>

      <p style={{
        color: "rgba(255,255,255,0.5)", fontSize: 14,
        marginBottom: 36, textAlign: "center",
        maxWidth: 280, lineHeight: 1.7,
      }}>
        Point your camera at the floor.<br />
        When the ring appears, tap to place.
      </p>

      <button
        ref={btnRef}
        onClick={launchAR}
        style={{
          padding: "15px 40px",
          background: "#fff", color: "#000",
          border: "none", borderRadius: 50,
          fontSize: 15, fontWeight: 700,
          cursor: "pointer", letterSpacing: 0.3,
          boxShadow: "0 8px 32px rgba(255,255,255,0.2)",
        }}
      >
        Launch AR
      </button>
    </div>
  );
}
