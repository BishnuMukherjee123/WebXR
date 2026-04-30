/**
 * ar-placement.js — Custom A-Frame AR Component
 * Loaded as a plain script AFTER A-Frame CDN in index.html.
 * Handles: hit-test, reticle, model placement, drift-prevention.
 */
/* global AFRAME */
(function () {
  if (!window.AFRAME) { console.error("AFRAME not found"); return; }

  AFRAME.registerComponent("ar-placement", {
    init() {
      console.log("[AR-COMPONENT] Initializing ar-placement component");
      this.hitTestSource          = null;
      this.hitTestSourceRequested = false;
      this.isPlaced               = false;
      this._surfaceReady          = false;

      const sceneEl  = this.el.sceneEl;
      const renderer = sceneEl.renderer;

      console.log("[AR-COMPONENT] Scene and renderer loaded");

      // Get refs after scene entities are ready
      sceneEl.addEventListener("loaded", () => {
        this.reticle = document.getElementById("ar-reticle");
        this.model   = document.getElementById("ar-model");
        console.log("[AR-COMPONENT] Scene loaded, entities found");
      });

      // XR controller tap
      this._controller = renderer.xr.getController(0);
      sceneEl.object3D.add(this._controller);
      this._onSelect = () => this._handleSelect();
      this._controller.addEventListener("select", this._onSelect);
      console.log("[AR-COMPONENT] XR controller listener added");

      // Force camera passthrough every time AR is entered
      sceneEl.addEventListener("enter-vr", () => {
        console.log("[AR-COMPONENT] enter-vr event fired - setting up camera passthrough");
        renderer.setClearColor(0x000000, 0);
        sceneEl.object3D.background = null;
      });

      renderer.xr.addEventListener("sessionstart", () => {
        console.log("[AR] WebXR session started");
        this.hitTestSourceRequested = false;
        this.hitTestSource          = null;
        this.isPlaced               = false;
        this._surfaceReady          = false;
        window.dispatchEvent(new CustomEvent("ar:sessionstart"));
      });

      renderer.xr.addEventListener("sessionend", () => {
        console.log("[AR] WebXR session ended");
        this.hitTestSource          = null;
        this.hitTestSourceRequested = false;
        window.dispatchEvent(new CustomEvent("ar:sessionend"));
      });

      window.resetAR = () => {
        if (this.model)   { this.model.object3D.visible = false; this.model.object3D.matrixAutoUpdate = true; }
        if (this.reticle)   this.reticle.object3D.visible = false;
        this.isPlaced      = false;
        this._surfaceReady = false;
        window.dispatchEvent(new CustomEvent("ar:reset"));
        window.dispatchEvent(new CustomEvent("ar:surface", { detail: false }));
      };
    },

    tick() {
      const sceneEl = this.el.sceneEl;

      // Re-enforce transparency every frame while in AR (belt-and-suspenders)
      if (sceneEl.is("ar-mode")) {
        sceneEl.renderer.setClearAlpha(0);
        if (sceneEl.object3D.background !== null) sceneEl.object3D.background = null;
      }

      if (!sceneEl.is("ar-mode") || !sceneEl.frame) {
        return;
      }

      const frame    = sceneEl.frame;
      const renderer = sceneEl.renderer;
      const session  = renderer.xr.getSession();
      const refSpace = renderer.xr.getReferenceSpace();

      if (!this.hitTestSourceRequested) {
        console.log("[AR-COMPONENT] Requesting hit-test source");
        session.requestReferenceSpace("viewer")
          .then(vs => {
            console.log("[AR-COMPONENT] Viewer reference space obtained");
            return session.requestHitTestSource({ space: vs });
          })
          .then(src => {
            console.log("[AR-COMPONENT] Hit-test source obtained");
            this.hitTestSource = src;
          })
          .catch((err) => {
            console.error("[AR-COMPONENT] Failed to get hit-test source:", err);
          });
        session.addEventListener("end", () => {
          console.log("[AR-COMPONENT] Session ended during hit-test request");
          this.hitTestSourceRequested = false;
          this.hitTestSource          = null;
        });
        this.hitTestSourceRequested = true;
      }

      if (!this.hitTestSource || !this.reticle || this.isPlaced) return;

      const results = frame.getHitTestResults(this.hitTestSource);
      if (results.length > 0) {
        const pose = results[0].getPose(refSpace);
        this.reticle.object3D.visible          = true;
        this.reticle.object3D.matrixAutoUpdate = false;
        this.reticle.object3D.matrix.fromArray(pose.transform.matrix);
        if (!this._surfaceReady) {
          console.log("[AR-COMPONENT] Surface detected!");
          this._surfaceReady = true;
          window.dispatchEvent(new CustomEvent("ar:surface", { detail: true }));
        }
      } else {
        this.reticle.object3D.visible = false;
        if (this._surfaceReady) {
          console.log("[AR-COMPONENT] Surface lost");
          this._surfaceReady = false;
          window.dispatchEvent(new CustomEvent("ar:surface", { detail: false }));
        }
      }
    },

    _handleSelect() {
      if (this.isPlaced || !this.reticle?.object3D.visible || !this.model) return;
      const m = this.reticle.object3D.matrix;
      this.model.object3D.position.setFromMatrixPosition(m);
      this.model.object3D.quaternion.setFromRotationMatrix(m);
      this.model.object3D.visible        = true;
      this.model.object3D.matrixAutoUpdate = false; // freeze = no drift
      this.model.object3D.updateMatrix();
      this.reticle.object3D.visible = false;
      this.isPlaced = true;
      window.dispatchEvent(new CustomEvent("ar:placed"));
      window.dispatchEvent(new CustomEvent("ar:surface", { detail: false }));
    },

    remove() {
      this._controller?.removeEventListener("select", this._onSelect);
    },
  });
})();
