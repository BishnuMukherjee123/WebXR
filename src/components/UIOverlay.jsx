import { createPortal } from "react-dom";
import "../styles/ar.css";

export default function UIOverlay() {
  const arOverlay = document.getElementById("ar-overlay");

  const content = (
    <>
      <div className="overlay-text">
        Point camera at a flat surface, then tap to place
      </div>
      <button className="reset-btn" onClick={() => window.resetAR?.()}>
        Reset
      </button>
    </>
  );

  // During AR: render inside #ar-overlay (the transparent domOverlay root)
  // so the buttons are visible over the camera feed.
  // Before AR: #ar-overlay is display:none so we render nothing here
  // (the ARButton itself is always visible as it's appended to body).
  return arOverlay ? createPortal(content, arOverlay) : null;
}