import { useEffect, useRef } from "react";

/**
 * AROverlay — In-session heads-up display
 *
 * DOM Overlay spec compliance (https://immersive-web.github.io/dom-overlays):
 *
 * 1. Root element must exist in the DOM BEFORE the XR session starts.
 *    → ARScene always renders the overlay div; we only toggle visibility here.
 *
 * 2. `beforexrselect` event:
 *    Fired on DOM elements when a WebXR "select" (tap) begins.
 *    Calling preventDefault() STOPS the WebXR session from receiving its own
 *    select/selectstart/selectend events.
 *    → We add this to ALL interactive UI elements so tapping a button does NOT
 *      also trigger model placement in the 3D scene.
 *
 * 3. `pointerEvents`:
 *    The overlay root must allow events to reach interactive children.
 *    Non-interactive areas use pointerEvents: none so taps fall through
 *    to the WebXR canvas for model placement.
 */
export default function AROverlay({ surfaceReady }) {
  const resetBtnRef = useRef(null);
  const menuBtnRef  = useRef(null);

  useEffect(() => {
    // Attach beforexrselect to each interactive element.
    // This prevents a button tap from ALSO triggering WebXR model placement.
    const stopXRSelect = (e) => e.preventDefault();

    const refs = [resetBtnRef, menuBtnRef];
    refs.forEach((r) => r.current?.addEventListener("beforexrselect", stopXRSelect));
    return () => {
      refs.forEach((r) => r.current?.removeEventListener("beforexrselect", stopXRSelect));
    };
  }, []);

  return (
    <>
      {/* Scan hint — centred at top, no pointer interaction */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          padding: "8px 22px",
          borderRadius: 24,
          fontSize: 14,
          fontWeight: 500,
          whiteSpace: "nowrap",
          backdropFilter: "blur(10px)",
          pointerEvents: "none",   // non-interactive — falls through for surface taps
          userSelect: "none",
        }}
      >
        {surfaceReady ? "✦ Surface detected · Tap to place" : "Slowly scan the floor…"}
      </div>

      {/* Bottom action row — interactive, beforexrselect attached via ref */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 16,
          pointerEvents: "none",   // container: fall-through
        }}
      >
        {/* Reset — pointerEvents: auto makes it tappable */}
        <button
          ref={resetBtnRef}
          onClick={() => window.resetAR?.()}
          style={{
            pointerEvents: "auto",
            padding: "12px 28px",
            background: "rgba(220,50,50,0.85)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          ↺ Reset
        </button>

        {/* Menu — pointerEvents: auto makes it tappable */}
        <button
          ref={menuBtnRef}
          onClick={() => window.dispatchEvent(new CustomEvent("ar:openMenu"))}
          style={{
            pointerEvents: "auto",
            padding: "12px 28px",
            background: "rgba(20,20,20,0.85)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          ☰ Menu
        </button>
      </div>
    </>
  );
}
