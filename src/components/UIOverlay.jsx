import { useState } from "react";
import "../styles/ar.css";

export default function UIOverlay() {
  const [arStarted, setArStarted] = useState(false);

  const handleStartAR = () => {
    if (!arStarted && window.startAR) {
      console.log("🎮 Start AR clicked");
      setArStarted(true);
      window.startAR();
    }
  };

  const handleReset = () => {
    if (window.resetAR) {
      window.resetAR();
    }
  };

  return (
    <>
      <button
        className="overlay-btn start-btn"
        onClick={handleStartAR}
        disabled={arStarted}
      >
        {arStarted ? "AR Running..." : "Start AR"}
      </button>

      <button
        className="overlay-btn reset-btn"
        onClick={handleReset}
      >
        Reset
      </button>

      <div className="overlay-text">
        Tap a surface to place object
      </div>
    </>
  );
}