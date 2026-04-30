import { useRef } from "react";

export default function ARLanding() {
  const btnRef = useRef(null);

  function launchAR() {
    if (window.location.protocol !== "https:" && !window.location.hostname.includes("localhost")) {
      alert("Camera AR requires HTTPS. Please access this site via HTTPS.");
      return;
    }

    const scene = document.querySelector("a-scene");
    if (!scene) {
      alert("Scene not ready. Please wait a moment.");
      return;
    }

    if (!scene.hasLoaded) {
      scene.addEventListener("loaded", launchAR, { once: true });
      return;
    }

    if (typeof window.startARjs !== "function") {
      alert("AR.js is still loading. Please try again.");
      return;
    }

    window.startARjs();
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 20,
      background: "linear-gradient(135deg, #101014 0%, #1b1e2b 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      pointerEvents: "auto",
      padding: 24,
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "rgba(255,255,255,0.07)",
        border: "1.5px solid rgba(255,255,255,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 30, marginBottom: 24,
      }}>
        AR
      </div>

      <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 700, marginBottom: 10 }}>
        Aroma AR
      </h1>

      <p style={{
        color: "rgba(255,255,255,0.62)", fontSize: 14,
        marginBottom: 36, textAlign: "center",
        maxWidth: 300, lineHeight: 1.7,
      }}>
        Point your camera at a Hiro marker to view the model.
      </p>

      <button
        ref={btnRef}
        onClick={launchAR}
        style={{
          padding: "15px 40px",
          background: "#fff", color: "#000",
          border: "none", borderRadius: 50,
          fontSize: 15, fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 8px 32px rgba(255,255,255,0.2)",
        }}
      >
        Launch AR
      </button>
    </div>
  );
}
