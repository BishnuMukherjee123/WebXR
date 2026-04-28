/**
 * UIOverlay — rendered inside the WebXR dom-overlay root (document.body).
 * Visible during an active AR session: shows a hint and a Reset button.
 */
export default function UIOverlay() {
  return (
    <>
      <div className="ar-hint">Point at a surface, then tap to place</div>
      <button className="reset-btn" onClick={() => window.resetAR?.()}>
        Reset
      </button>
    </>
  );
}