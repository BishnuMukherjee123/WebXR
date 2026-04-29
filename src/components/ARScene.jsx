import { useAREngine } from "../hooks/useAREngine";
import AROverlay from "./AROverlay";
import ARLanding from "./ARLanding";

/**
 * ARScene — root AR component
 *
 * DOM Overlay spec compliance:
 *   - The overlay root <div> (overlayRef) MUST exist in the DOM BEFORE the XR
 *     session is requested. React conditional rendering ({inSession && <div>})
 *     would remove it from the DOM — violating the spec and causing the feature
 *     to silently fail on Chrome Android.
 *   - Solution: always render the overlay div. Toggle AROverlay content inside.
 *   - The root background MUST be transparent (spec §CSS). We set no background
 *     on the root; child elements carry their own backgrounds.
 *   - pointerEvents on root: "none" by default so taps fall through to the
 *     WebXR canvas. Interactive children override this with pointerEvents: auto.
 *     beforexrselect handlers on children prevent UI taps from also firing
 *     WebXR select (see AROverlay.jsx).
 */
export default function ARScene() {
  const { canvasRef, overlayRef, xrHelperRef, inSession, surfaceReady } = useAREngine();

  return (
    <>
      {/* Babylon.js WebGL render target */}
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          position: "fixed",
          inset: 0,
          outline: "none",
          touchAction: "none",
        }}
      />

      {/*
        WebXR DOM Overlay root — ALWAYS in the DOM (spec requirement).
        The UA places this as a transparent rectangle over the camera feed.
        Background must be transparent (no background property here).
        zIndex is managed by the UA; setting one here only affects content within.
      */}
      <div
        ref={overlayRef}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",  // falls through for surface taps; children override
          zIndex: 10,
          // No background — UA requires transparency on the root
        }}
      >
        {/* AROverlay shown only during active XR session */}
        {inSession && <AROverlay surfaceReady={surfaceReady} />}
      </div>

      {/* Pre-session landing screen (outside overlay root — not part of XR overlay) */}
      {!inSession && <ARLanding xrHelperRef={xrHelperRef} />}
    </>
  );
}