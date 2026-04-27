import "../styles/ar.css";

export default function UIOverlay() {
  return (
    <>
      <button
        className="overlay-btn"
        onClick={() => window.startAR()}
      >
        Start AR
      </button>

      <button
        className="overlay-btn"
        onClick={() => window.resetAR()}
      >
        Reset
      </button>

      <div className="overlay-text">
        Tap a surface to place object
      </div>
    </>
  );
}