/**
 * ar-placement.js
 *
 * Custom A-Frame component that powers the entire AR experience:
 *   1. WebXR hit-test — finds real floor surfaces every frame
 *   2. Reticle updates — positions the ring on the detected surface
 *   3. On tap (select) — places the GLB model at the reticle position
 *   4. matrixAutoUpdate = false — equivalent to Babylon's freezeWorldMatrix()
 *      Locks the model to a fixed world-space position → prevents drift
 *   5. Custom DOM events — lets React UI react to AR state changes
 *
 * Communication with React:
 *   A-Frame → React : CustomEvents on window
 *     'ar:sessionstart' | 'ar:sessionend' | 'ar:surface' | 'ar:placed' | 'ar:reset'
 *   React → A-Frame : window.resetAR()
 */
(function registerARComponents() {
  if (!window.AFRAME) {
    console.error("A-Frame not loaded — ar-placement cannot register.");
    return;
  }

  AFRAME.registerComponent("ar-placement", {
    init() {
      this.hitTestSource          = null;
      this.hitTestSourceRequested = false;
      this.isPlaced               = false;
      this._surfaceReady          = false;

      const sceneEl   = this.el.sceneEl;
      const renderer  = sceneEl.renderer;

      // ── References to scene objects (queried after scene loaded) ─────────
      sceneEl.addEventListener("loaded", () => {
        this.reticle = document.getElementById("ar-reticle");
        this.model   = document.getElementById("ar-model");
      });

      // ── XR controller — fires 'select' on tap ───────────────────────────
      this._controller = renderer.xr.getController(0);
      sceneEl.object3D.add(this._controller);
      this._onSelect = () => this._handleSelect();
      this._controller.addEventListener("select", this._onSelect);

      // ── Session lifecycle ────────────────────────────────────────────────
      // FIX: BLACK SCREEN — When entering AR, the renderer MUST have
      // clearAlpha=0 and scene.background=null so the camera feed shows
      // through the WebGL canvas. A-Frame's background component can override
      // this, so we set it explicitly here every time AR is entered.
      // NOTE: sceneEl is already declared above at line 30 — no re-declaration.
      sceneEl.addEventListener("enter-vr", () => {
        renderer.setClearColor(0x000000, 0); // alpha=0 → transparent
        sceneEl.object3D.background = null;  // no skybox/color blocking camera
      });

      renderer.xr.addEventListener("sessionstart", () => {
        this.hitTestSourceRequested = false;
        this.hitTestSource          = null;
        this.isPlaced               = false;
        this._surfaceReady          = false;
        window.dispatchEvent(new CustomEvent("ar:sessionstart"));
      });

      renderer.xr.addEventListener("sessionend", () => {
        this.hitTestSource          = null;
        this.hitTestSourceRequested = false;
        window.dispatchEvent(new CustomEvent("ar:sessionend"));
      });

      // ── Global reset (called from React Reset button) ────────────────────
      window.resetAR = () => {
        if (this.model) {
          this.model.object3D.visible        = false;
          this.model.object3D.matrixAutoUpdate = true; // unfreeze
        }
        if (this.reticle) this.reticle.object3D.visible = false;
        this.isPlaced       = false;
        this._surfaceReady  = false;
        window.dispatchEvent(new CustomEvent("ar:reset"));
        window.dispatchEvent(new CustomEvent("ar:surface", { detail: false }));
      };
    },

    // ── Called every XR frame ──────────────────────────────────────────────
    tick() {
      const sceneEl = this.el.sceneEl;
      if (!sceneEl.is("ar-mode") || !sceneEl.frame) return;

      const frame    = sceneEl.frame;
      const renderer = sceneEl.renderer;
      const session  = renderer.xr.getSession();
      const refSpace = renderer.xr.getReferenceSpace();

      // Request hit-test source once per session
      if (!this.hitTestSourceRequested) {
        session
          .requestReferenceSpace("viewer")
          .then((viewerSpace) =>
            session.requestHitTestSource({ space: viewerSpace })
          )
          .then((source) => { this.hitTestSource = source; })
          .catch(console.error);

        session.addEventListener("end", () => {
          this.hitTestSourceRequested = false;
          this.hitTestSource          = null;
        });
        this.hitTestSourceRequested = true;
      }

      // Update reticle each frame from hit-test results
      if (!this.hitTestSource || !this.reticle || this.isPlaced) return;

      const results = frame.getHitTestResults(this.hitTestSource);
      if (results.length > 0) {
        const pose = results[0].getPose(refSpace);

        this.reticle.object3D.visible          = true;
        this.reticle.object3D.matrixAutoUpdate = false;
        this.reticle.object3D.matrix.fromArray(pose.transform.matrix);

        if (!this._surfaceReady) {
          this._surfaceReady = true;
          window.dispatchEvent(new CustomEvent("ar:surface", { detail: true }));
        }
      } else {
        this.reticle.object3D.visible = false;
        if (this._surfaceReady) {
          this._surfaceReady = false;
          window.dispatchEvent(new CustomEvent("ar:surface", { detail: false }));
        }
      }
    },

    // ── Place model at reticle world position ─────────────────────────────
    _handleSelect() {
      if (this.isPlaced || !this.reticle?.object3D.visible || !this.model) return;

      // Copy full 4×4 transform from reticle (includes rotation from hit normal)
      const m = this.reticle.object3D.matrix;
      this.model.object3D.position.setFromMatrixPosition(m);
      this.model.object3D.quaternion.setFromRotationMatrix(m);
      this.model.object3D.visible = true;

      // FREEZE: matrixAutoUpdate = false locks the model to a fixed
      // world-space point. When ARCore refines its world map, this
      // object does NOT move — it stays pinned to the screen position
      // where the user tapped. This is the A-Frame equivalent of
      // Babylon.js's freezeWorldMatrix() and prevents drift.
      this.model.object3D.matrixAutoUpdate = false;
      this.model.object3D.updateMatrix();

      if (this.reticle) this.reticle.object3D.visible = false;
      this.isPlaced = true;
      window.dispatchEvent(new CustomEvent("ar:placed"));
      window.dispatchEvent(new CustomEvent("ar:surface", { detail: false }));
    },

    remove() {
      this._controller?.removeEventListener("select", this._onSelect);
    },
  });
})();
