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
    const scene = document.querySelector("a-scene");
    if (!scene) {
      alert("Scene not ready — please wait a moment.");
      return;
    }
    // A-Frame 1.6: enterAR() requests an immersive-ar session
    scene.enterAR().catch((err) => {
      console.error("AR session failed:", err);
      alert("Could not start AR. Make sure you are on HTTPS and using Chrome on Android.");
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
