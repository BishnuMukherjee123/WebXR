/**
 * AR.js marker bridge for the React overlay.
 * Loaded after A-Frame + AR.js and before the scene is parsed.
 */
/* global AFRAME */
(function () {
  if (!window.AFRAME) {
    console.error("AFRAME not found");
    return;
  }

  AFRAME.registerComponent("ar-placement", {
    init() {
      this.sceneEl = this.el.sceneEl;
      this.marker = null;
      this.model = null;
      this.inSession = false;

      this.sceneEl.addEventListener("loaded", () => {
        this.marker = document.getElementById("ar-marker");
        this.model = document.getElementById("ar-model");

        if (!this.marker || !this.model) {
          console.error("[AR.js] Marker or model entity not found");
          return;
        }

        this.marker.addEventListener("markerFound", () => {
          console.log("[AR.js] Marker found");
          window.dispatchEvent(new CustomEvent("ar:surface", { detail: true }));
        });

        this.marker.addEventListener("markerLost", () => {
          console.log("[AR.js] Marker lost");
          window.dispatchEvent(new CustomEvent("ar:surface", { detail: false }));
        });

        console.log("[AR.js] Scene loaded");
      });

      window.startARjs = () => {
        if (this.inSession) return;
        this.inSession = true;
        document.body.classList.add("arjs-running");
        window.dispatchEvent(new CustomEvent("ar:sessionstart"));
        console.log("[AR.js] Session UI started");
      };

      window.resetAR = () => {
        if (this.model) {
          this.model.setAttribute("visible", "true");
          this.model.object3D.visible = true;
        }
        window.dispatchEvent(new CustomEvent("ar:reset"));
        window.dispatchEvent(new CustomEvent("ar:surface", {
          detail: Boolean(this.marker && this.marker.object3D.visible),
        }));
      };
    },

    remove() {
      delete window.startARjs;
      delete window.resetAR;
    },
  });
})();
