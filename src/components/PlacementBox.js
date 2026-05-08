import * as THREE from 'three';

const CONFIG = {
  MIN_TOUCH_AREA: 0.05,
  BASE_RADIUS: 0.15,
  LINE_WIDTH: 0.02,
  SEGMENTS: 16,
  DELTA_PHI: Math.PI / (2 * 16),
  COLORS: {
    EDGE_FALLOFF: new THREE.Color(0.98, 0.98, 0.98),
    EDGE_CUTOFF: new THREE.Color(0.8, 0.8, 0.8),
    FILL_FALLOFF: new THREE.Color(0.4, 0.4, 0.4),
    FILL_CUTOFF: new THREE.Color(0.4, 0.4, 0.4),
    ACTIVE_EDGE: new THREE.Color(1.0, 1.0, 1.0),
    ACTIVE_FILL: new THREE.Color(0.6, 0.6, 0.6),
  },
  MAX_OPACITY: 0.75,
  ACTIVE_OPACITY: 0.9,
  FILL_OPACITY_MULTIPLIER: 0.5,
  INTERACTIVE_OPACITY_MULTIPLIER: 1.2,
};

const addCorner = (vertices, cornerX, cornerY, radius, lineWidth) => {
  let phi = cornerX > 0 ? (cornerY > 0 ? 0 : -Math.PI / 2) : (cornerY > 0 ? Math.PI / 2 : Math.PI);
  for (let i = 0; i <= CONFIG.SEGMENTS; ++i) {
    vertices.push(
      cornerX + (radius - lineWidth) * Math.cos(phi),
      cornerY + (radius - lineWidth) * Math.sin(phi),
      0,
      cornerX + radius * Math.cos(phi),
      cornerY + radius * Math.sin(phi),
      0
    );
    phi += CONFIG.DELTA_PHI;
  }
};

export class PlacementBox extends THREE.Group {
  constructor(modelBox) {
    super();
    this.goalSize = new THREE.Vector3();
    this.currentOpacity = 0;
    this.goalOpacity = 0;
    this.isActive = false;

    this.edgeMaterial = new THREE.MeshBasicMaterial({
      color: CONFIG.COLORS.EDGE_FALLOFF,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.fillMaterial = new THREE.MeshBasicMaterial({
      color: CONFIG.COLORS.FILL_FALLOFF,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    this.boxMesh = new THREE.Mesh(new THREE.BufferGeometry(), this.edgeMaterial);
    this.boxMesh.rotation.x = -Math.PI / 2; // Flat on the floor
    this.add(this.boxMesh);

    this.updateSizeFromBox(modelBox);
  }

  updateSizeFromBox(boundingBox) {
    boundingBox.getSize(this.goalSize);
    
    const modelDiagonal = Math.sqrt(this.goalSize.x * this.goalSize.x + this.goalSize.z * this.goalSize.z);
    const proportionalMinSize = Math.max(CONFIG.MIN_TOUCH_AREA, modelDiagonal * 0.4);

    if (this.goalSize.x < proportionalMinSize) this.goalSize.x = proportionalMinSize;
    if (this.goalSize.z < proportionalMinSize) this.goalSize.z = proportionalMinSize;

    this.updateGeometry();
  }

  updateGeometry() {
    const geometry = this.boxMesh.geometry;
    const triangles = [];
    const vertices = [];

    const x = this.goalSize.x / 2;
    const y = this.goalSize.z / 2; // Z because it's laying flat

    const modelSize = Math.min(x, y);
    const radius = Math.max(CONFIG.BASE_RADIUS * 0.7, modelSize * 0.2);
    const lineWidth = Math.max(CONFIG.LINE_WIDTH * 0.7, modelSize * 0.025);

    addCorner(vertices, x, y, radius, lineWidth);
    addCorner(vertices, -x, y, radius, lineWidth);
    addCorner(vertices, -x, -y, radius, lineWidth);
    addCorner(vertices, x, -y, radius, lineWidth);

    const numVertices = vertices.length / 3;
    for (let i = 0; i < numVertices - 2; i += 2) {
      triangles.push(i, i + 1, i + 3, i, i + 3, i + 2);
    }
    const i = numVertices - 2;
    triangles.push(i, i + 1, 1, i, 1, 0);

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(triangles);
    geometry.computeBoundingSphere();
  }

  set show(visible) {
    this.goalOpacity = visible ? CONFIG.MAX_OPACITY : 0;
  }

  setInteractionState(isActive) {
    this.isActive = isActive;
    if (isActive) {
      this.edgeMaterial.color.copy(CONFIG.COLORS.ACTIVE_EDGE);
    } else {
      this.edgeMaterial.color.copy(CONFIG.COLORS.EDGE_FALLOFF);
    }
  }

  update(delta) {
    // Simple lerp for opacity
    this.currentOpacity += (this.goalOpacity - this.currentOpacity) * (delta * 10);
    this.edgeMaterial.opacity = this.currentOpacity;
    this.fillMaterial.opacity = this.currentOpacity * CONFIG.FILL_OPACITY_MULTIPLIER;

    if (this.isActive) {
      this.edgeMaterial.opacity = this.currentOpacity * CONFIG.INTERACTIVE_OPACITY_MULTIPLIER;
    }
    this.visible = this.currentOpacity > 0.01;
  }
}
