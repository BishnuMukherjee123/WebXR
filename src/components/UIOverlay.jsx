import "../styles/ar.css";

export default function UIOverlay() {
  return (
    <>
      <div className="overlay-text">
        Point at a surface, then tap to place
      </div>
      <button className="reset-btn" onClick={() => window.resetAR?.()}>
        Reset
      </button>
    </>
  );
}