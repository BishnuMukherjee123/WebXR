export async function startXRSession(renderer) {
  const session = await navigator.xr.requestSession("immersive-ar", {
    requiredFeatures: ["hit-test", "dom-overlay"],
    domOverlay: { root: document.body },
  });

  renderer.xr.setSession(session);

  return session;
}