/** In-session heads-up display: scan hint + Reset button */
export default function AROverlay({ surfaceReady }) {
  return (
    <>
      <div style={{
        position: "absolute", top: 20, left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.6)", color: "#fff",
        padding: "8px 22px", borderRadius: 24,
        fontSize: 14, fontWeight: 500,
        whiteSpace: "nowrap", backdropFilter: "blur(10px)",
      }}>
        {surfaceReady ? "Surface detected · Tap to place" : "Slowly scan the floor…"}
      </div>

      <button
        onClick={() => window.resetAR?.()}
        style={{
          position: "absolute", top: 16, right: 16,
          pointerEvents: "auto", padding: "8px 18px",
          background: "rgba(20,20,20,0.85)", color: "#fff",
          border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: 8, fontSize: 13, fontWeight: 600,
          cursor: "pointer", backdropFilter: "blur(6px)",
        }}
      >
        Reset
      </button>
    </>
  );
}
