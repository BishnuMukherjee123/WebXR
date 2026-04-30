import { useEffect, useRef } from "react";

export default function AROverlay({ surfaceReady }) {
  const resetBtnRef = useRef(null);
  const menuBtnRef = useRef(null);

  useEffect(() => {
    const stopSelect = (e) => e.preventDefault();
    const refs = [resetBtnRef, menuBtnRef];
    refs.forEach((r) => r.current?.addEventListener("beforexrselect", stopSelect));
    return () => {
      refs.forEach((r) => r.current?.removeEventListener("beforexrselect", stopSelect));
    };
  }, []);

  return (
    <>
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
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {surfaceReady ? "Marker found" : "Show the Hiro marker"}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 32,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 16,
          pointerEvents: "none",
        }}
      >
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
          Reset
        </button>

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
          Menu
        </button>
      </div>
    </>
  );
}
