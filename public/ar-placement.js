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
      this.previewStream = null;
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
        this._forceTransparentRenderer();
      });

      this.sceneEl.addEventListener("camera-init", () => {
        console.log("[AR.js] Camera initialized");
        this._syncCameraVideoStyles();
      });

      this.sceneEl.addEventListener("camera-error", (event) => {
        console.error("[AR.js] Camera error", event.detail || event);
        alert("Camera could not start. Please allow camera permission and reload the page.");
      });

      window.startARjs = async () => {
        if (this.inSession) return;
        this.inSession = true;
        document.body.classList.add("arjs-running");
        await this._startPreviewVideo();
        this._forceTransparentRenderer();
        this._syncCameraVideoStyles();
        this.videoStyleTimer = window.setInterval(() => {
          this._syncCameraVideoStyles();
          this._forceTransparentRenderer();
        }, 500);
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

    tick() {
      if (this.inSession) this._forceTransparentRenderer();
    },

    async _startPreviewVideo() {
      let preview = document.getElementById("camera-preview");
      if (!preview) {
        preview = document.createElement("video");
        preview.id = "camera-preview";
        preview.muted = true;
        preview.autoplay = true;
        preview.playsInline = true;
        preview.setAttribute("playsinline", "");
        preview.setAttribute("webkit-playsinline", "");
        document.body.prepend(preview);
      }

      if (!this.previewStream) {
        try {
          this.previewStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
          console.log("[AR.js] Preview camera stream started");
        } catch (error) {
          console.error("[AR.js] Preview camera failed", error);
          return;
        }
      }

      preview.srcObject = this.previewStream;
      try {
        await preview.play();
        console.log("[AR.js] Preview video playing", `${preview.videoWidth}x${preview.videoHeight}`);
      } catch (error) {
        console.warn("[AR.js] Preview video play was blocked", error);
      }
    },

    _forceTransparentRenderer() {
      const renderer = this.sceneEl && this.sceneEl.renderer;
      const scene = this.sceneEl && this.sceneEl.object3D;
      if (!renderer) return;
      renderer.autoClear = true;
      renderer.setClearColor(0x000000, 0);
      renderer.setClearAlpha(0);
      if (scene) scene.background = null;
    },

    _syncCameraVideoStyles() {
      document.querySelectorAll("video").forEach((video) => {
        const isPreview = video.id === "camera-preview";
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
          opacity: isPreview ? "1" : "0",
          visibility: "visible",
          pointerEvents: "none",
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
          zIndex: "2",
        });
      }
    },

    remove() {
      if (this.videoStyleTimer) window.clearInterval(this.videoStyleTimer);
      if (this.previewStream) {
        this.previewStream.getTracks().forEach((track) => track.stop());
      }
      delete window.startARjs;
      delete window.resetAR;
    },
  });
})();
