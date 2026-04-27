import "../styles/ar.css";

export default function UIOverlay() {
  return (
    <>
      <button
        className="overlay-btn start-btn"
        onClick={() => window.startAR && window.startAR()}
      >
        Start AR
      </button>

      <button
        className="overlay-btn reset-btn"
        onClick={() => window.resetAR && window.resetAR()}
      >
        Reset
      </button>

      <div className="overlay-text">
        Tap a surface to place object
      </div>
    </>
  );
}