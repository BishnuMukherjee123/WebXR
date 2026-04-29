import { useEffect, useState } from "react";
import AROverlay from "./AROverlay";
import ARLanding from "./ARLanding";

/**
 * ARScene — React UI layer only.
 * The actual A-Frame 3D scene lives in index.html (outside React).
 * This component listens to CustomEvents from ar-placement.js
 * and renders the correct UI on top.
 */
export default function ARScene() {
  const [inSession,    setInSession]    = useState(false);
  const [surfaceReady, setSurfaceReady] = useState(false);

  useEffect(() => {
    const onStart   = ()  => setInSession(true);
    const onEnd     = ()  => { setInSession(false); setSurfaceReady(false); };
    const onSurface = (e) => setSurfaceReady(!!e.detail);
    const onReset   = ()  => setSurfaceReady(false);

    window.addEventListener("ar:sessionstart", onStart);
    window.addEventListener("ar:sessionend",   onEnd);
    window.addEventListener("ar:surface",      onSurface);
    window.addEventListener("ar:reset",        onReset);
    return () => {
      window.removeEventListener("ar:sessionstart", onStart);
      window.removeEventListener("ar:sessionend",   onEnd);
      window.removeEventListener("ar:surface",      onSurface);
      window.removeEventListener("ar:reset",        onReset);
    };
  }, []);

  return (
    // pointer-events: none so taps pass through to the A-Frame canvas below
    <div style={{ position: "fixed", inset: 0, zIndex: 10, pointerEvents: "none" }}>
      {/* In-session HUD — buttons, scan hint */}
      {inSession && <AROverlay surfaceReady={surfaceReady} />}

      {/* Pre-session landing screen */}
      {!inSession && <ARLanding />}
    </div>
  );
}