export async function startXRSession(renderer) {
  const session = await navigator.xr.requestSession("immersive-ar", {
    requiredFeatures: ["hit-test", "dom-overlay"],
    optionalFeatures: ["dom-overlay-for-handheld-ar"],
    domOverlay: { root: document.getElementById("ui-overlay") || document.body },
  });

  renderer.xr.setSession(session);

  return session;
}