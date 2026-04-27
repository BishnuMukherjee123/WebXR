export async function startXRSession(renderer) {
  console.log("📱 Requesting immersive-ar session...");
  
  if (!renderer.xr.enabled) {
    throw new Error("XR not enabled on renderer");
  }

  try {
    const session = await navigator.xr.requestSession("immersive-ar", {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: document.body },
    });

    console.log("📱 Session created successfully");
    renderer.xr.setSession(session);
    console.log("📱 Session attached to renderer");

    return session;
  } catch (err) {
    console.error("📱 Session request error:", err);
    throw err;
  }
}