import { useAREngine } from "../hooks/useAREngine";
import AROverlay from "./AROverlay";
import ARLanding from "./ARLanding";

/** Root AR component — wires the engine hook to the UI components */
export default function ARScene() {
  const { canvasRef, overlayRef, xrHelperRef, inSession, surfaceReady } = useAREngine();

  return (
    <>
      {/* Babylon.js render target */}
      <canvas
        ref={canvasRef}
        style={{
          width: "100%", height: "100%",
          display: "block", position: "fixed",
          inset: 0, outline: "none", touchAction: "none",
        }}
      />

      {/* WebXR DOM overlay root (must exist in the DOM before session starts) */}
      <div
        ref={overlayRef}
        style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10 }}
      >
        {inSession && <AROverlay surfaceReady={surfaceReady} />}
      </div>

      {/* Pre-session landing screen */}
      {!inSession && <ARLanding xrHelperRef={xrHelperRef} />}
    </>
  );
}