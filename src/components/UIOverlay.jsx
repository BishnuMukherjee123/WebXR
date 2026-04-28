import { useState } from "react";
import "../styles/ar.css";

export default function UIOverlay() {
  // ARButton from Three.js is injected directly into document.body by ARScene.
  // This overlay only provides the Reset button and the hint text.

  const handleReset = () => {
    if (window.resetAR) window.resetAR();
  };

  return (
    <>
      <button className="overlay-btn reset-btn" onClick={handleReset}>
        Reset
      </button>

      <div className="overlay-text">
        Point camera at a flat surface, then tap to place
      </div>
    </>
  );
}