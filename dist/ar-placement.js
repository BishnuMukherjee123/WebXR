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
      this.videoStyleTimer = null;

      this.sceneEl.addEventListener("loaded", () => {
        this.marker = document.getElementById("ar-marker");
        this.model = document.getElementById("ar-model");

        if (!this.marker || !this.model) {
          console.error("[AR.js] Marker or model entity not found");
          return;
        }

        this.marker.addEventListener("markerFound", () => {
          console.log("[AR.js] Marker found");
          if (this.model) this.model.setAttribute("visible", "true");
          window.dispatchEvent(new CustomEvent("ar:surface", { detail: true }));
        });

        this.marker.addEventListener("markerLost", () => {
          console.log("[AR.js] Marker lost");
          window.dispatchEvent(new CustomEvent("ar:surface", { detail: false }));
        });

        console.log("[AR.js] Scene loaded");
      });

      this.sceneEl.addEventListener("camera-init", () => {
        console.log("[AR.js] Camera initialized");
        this._syncCameraVideoStyles();
      });

      this.sceneEl.addEventListener("camera-error", (event) => {
        console.error("[AR.js] Camera error", event.detail || event);
        alert("Camera could not start. Please allow camera permission and reload the page.");
      });

      window.startARjs = () => {
        if (this.inSession) return;
        this.inSession = true;
        document.body.classList.add("arjs-running");
        this._syncCameraVideoStyles();
        this.videoStyleTimer = window.setInterval(() => this._syncCameraVideoStyles(), 500);
        window.setTimeout(() => {
          if (!document.querySelector("#arjs-video, video")) {
            console.warn("[AR.js] Camera video element was not found after launch");
          }
        }, 2000);
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

    _syncCameraVideoStyles() {
      document.querySelectorAll("#arjs-video, video").forEach((video) => {
        video.setAttribute("playsinline", "");
        video.setAttribute("webkit-playsinline", "");
        Object.assign(video.style, {
          position: "fixed",
          top: "0",
          left: "0",
          width: "100vw",
          height: "100vh",
          objectFit: "cover",
          zIndex: "0",
          display: "block",
          opacity: "1",
          visibility: "visible",
        });
      });

      const canvas = this.sceneEl && this.sceneEl.canvas;
      if (canvas) {
        Object.assign(canvas.style, {
          position: "fixed",
          top: "0",
          left: "0",
          width: "100vw",
          height: "100vh",
          background: "transparent",
        });
      }
    },

    remove() {
      if (this.videoStyleTimer) window.clearInterval(this.videoStyleTimer);
      delete window.startARjs;
      delete window.resetAR;
    },
  });
})();
