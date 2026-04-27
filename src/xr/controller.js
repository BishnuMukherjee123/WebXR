controller = renderer.xr.getController(0);

controller.addEventListener("select", async () => {
  if (!reticle.visible) return;

  const model = await loadGLB("/models/10.glb");

  // 📍 Position
  model.position.setFromMatrixPosition(reticle.matrix);

  // 🔄 Rotation (VERY IMPORTANT)
  model.quaternion.setFromRotationMatrix(reticle.matrix);

  // 📏 Scale (adjust based on your model)
  model.scale.set(0.3, 0.3, 0.3);

  scene.add(model);
  placedObjects.push(model);
});

scene.add(controller);