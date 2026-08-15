import * as THREE from 'three';

const COLORS = {
  edge: 0x8e9a96,
  edgeSoft: 0x4b5753,
  black: 0x080b0a,
  dark: 0x101614,
  mid: 0x202a27,
  surface: 0x2d3935,
  cyan: 0x73ddd0,
  lime: 0xb9dc63,
  white: 0xe8ece5,
};

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function between(random, minimum, maximum) {
  return minimum + (maximum - minimum) * random();
}

function choose(random, values) {
  return values[Math.floor(random() * values.length)];
}

function createMaterials() {
  return {
    black: new THREE.MeshStandardMaterial({ color: COLORS.black, roughness: 0.72, metalness: 0.35 }),
    dark: new THREE.MeshStandardMaterial({ color: COLORS.dark, roughness: 0.66, metalness: 0.42 }),
    mid: new THREE.MeshStandardMaterial({ color: COLORS.mid, roughness: 0.58, metalness: 0.5 }),
    surface: new THREE.MeshStandardMaterial({ color: COLORS.surface, roughness: 0.52, metalness: 0.5 }),
    cyan: new THREE.MeshStandardMaterial({
      color: COLORS.cyan,
      emissive: COLORS.cyan,
      emissiveIntensity: 0.22,
      roughness: 0.38,
      metalness: 0.35,
    }),
    lime: new THREE.MeshStandardMaterial({
      color: COLORS.lime,
      emissive: COLORS.lime,
      emissiveIntensity: 0.16,
      roughness: 0.4,
      metalness: 0.3,
    }),
    white: new THREE.MeshStandardMaterial({ color: COLORS.white, roughness: 0.52, metalness: 0.25 }),
    hardware: new THREE.MeshStandardMaterial({ color: COLORS.edge, roughness: 0.46, metalness: 0.62 }),
    edge: new THREE.LineBasicMaterial({ color: COLORS.edge, transparent: true, opacity: 0.72 }),
    edgeSoft: new THREE.LineBasicMaterial({ color: COLORS.edgeSoft, transparent: true, opacity: 0.45 }),
  };
}

function addOutlinedMesh(parent, geometry, material, edgeMaterial, disposables) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const edgeGeometry = new THREE.EdgesGeometry(geometry, 28);
  const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
  edges.renderOrder = 2;
  mesh.add(edges);

  parent.add(mesh);
  disposables.push(geometry, edgeGeometry);
  return mesh;
}

function addBox(parent, materials, disposables, options) {
  const {
    size,
    position,
    material = materials.dark,
    edge = materials.edge,
    rotation = [0, 0, 0],
  } = options;
  const mesh = addOutlinedMesh(
    parent,
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    material,
    edge,
    disposables,
  );
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  return mesh;
}

function addCylinder(parent, materials, disposables, options) {
  const {
    radius,
    height,
    position,
    material = materials.dark,
    edge = materials.edge,
    rotation = [0, 0, 0],
    segments = 48,
  } = options;
  const mesh = addOutlinedMesh(
    parent,
    new THREE.CylinderGeometry(radius, radius, height, segments),
    material,
    edge,
    disposables,
  );
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  return mesh;
}

function addSphere(parent, materials, disposables, options) {
  const { radius, position, material = materials.cyan } = options;
  const geometry = new THREE.SphereGeometry(radius, 24, 16);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  parent.add(mesh);
  disposables.push(geometry);
  return mesh;
}

function addConduit(parent, materials, disposables, points, material = materials.cyan) {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
  const geometry = new THREE.TubeGeometry(curve, 48, 0.055, 10, false);
  const conduit = new THREE.Mesh(geometry, material);
  conduit.castShadow = true;
  parent.add(conduit);
  disposables.push(geometry);
  return conduit;
}

function addPanelLines(parent, materials, disposables, position, width, depth, count) {
  for (let index = 1; index < count; index += 1) {
    addBox(parent, materials, disposables, {
      size: [0.018, 0.012, depth - 0.16],
      position: [position[0] - width / 2 + (width / count) * index, position[1], position[2]],
      material: materials.hardware,
      edge: materials.edgeSoft,
    });
  }
}

export function buildMachine(seed) {
  const random = seededRandom(seed);
  const materials = createMaterials();
  const disposables = [];
  const group = new THREE.Group();
  const animated = [];

  const baseWidth = between(random, 5.7, 6.5);
  const baseDepth = between(random, 3.8, 4.6);
  addBox(group, materials, disposables, {
    size: [baseWidth, 0.34, baseDepth],
    position: [0, 0, 0],
    material: materials.dark,
  });
  addBox(group, materials, disposables, {
    size: [baseWidth - 0.28, 0.05, baseDepth - 0.28],
    position: [0, 0.195, 0],
    material: materials.black,
    edge: materials.edgeSoft,
  });

  const panelWidth = between(random, 1.35, 1.9);
  const panelDepth = between(random, 1.15, 1.55);
  const panelX = -baseWidth * 0.24;
  const panelZ = between(random, 0.65, 1.05);
  addBox(group, materials, disposables, {
    size: [panelWidth, 0.12, panelDepth],
    position: [panelX, 0.27, panelZ],
    material: materials.black,
    edge: materials.cyan,
  });
  addPanelLines(group, materials, disposables, [panelX, 0.34, panelZ], panelWidth, panelDepth, 5);

  const towerCount = 2 + Math.floor(random() * 2);
  const towers = [];
  for (let index = 0; index < towerCount; index += 1) {
    const width = between(random, 1.25, 1.9);
    const depth = between(random, 1.15, 1.75);
    const height = between(random, 0.7, 1.65) + index * 0.18;
    const x = -0.55 + index * 1.25 + between(random, -0.16, 0.16);
    const z = -0.35 - index * 0.42 + between(random, -0.22, 0.22);
    const material = choose(random, [materials.mid, materials.surface, materials.dark]);
    addBox(group, materials, disposables, {
      size: [width, height, depth],
      position: [x, 0.34 + height / 2, z],
      material,
    });
    towers.push({ x, z, width, depth, height });
  }

  const focalTower = towers[towers.length - 1];
  const padWidth = Math.min(focalTower.width * 0.56, 0.95);
  addBox(group, materials, disposables, {
    size: [padWidth, 0.08, focalTower.depth * 0.54],
    position: [
      focalTower.x - focalTower.width * 0.11,
      0.38 + focalTower.height,
      focalTower.z + focalTower.depth * 0.05,
    ],
    material: random() > 0.5 ? materials.lime : materials.cyan,
    edge: materials.white,
  });

  const rotorRoot = new THREE.Group();
  const rotorRadius = between(random, 0.62, 0.9);
  const rotorY = 0.5 + focalTower.height + between(random, 0.28, 0.48);
  rotorRoot.position.set(focalTower.x + focalTower.width * 0.06, rotorY, focalTower.z);
  group.add(rotorRoot);

  const platter = addCylinder(rotorRoot, materials, disposables, {
    radius: rotorRadius,
    height: 0.15,
    position: [0, 0, 0],
    material: materials.black,
    edge: materials.cyan,
    segments: 64,
  });
  const outerRingGeometry = new THREE.TorusGeometry(rotorRadius * 0.92, 0.055, 12, 64);
  const outerRing = new THREE.Mesh(outerRingGeometry, materials.cyan);
  outerRing.rotation.x = Math.PI / 2;
  outerRing.position.y = 0.09;
  rotorRoot.add(outerRing);
  disposables.push(outerRingGeometry);

  const innerRingGeometry = new THREE.TorusGeometry(rotorRadius * 0.34, 0.05, 12, 48);
  const innerRing = new THREE.Mesh(innerRingGeometry, materials.lime);
  innerRing.rotation.x = Math.PI / 2;
  innerRing.position.y = 0.105;
  rotorRoot.add(innerRing);
  disposables.push(innerRingGeometry);
  addSphere(rotorRoot, materials, disposables, {
    radius: 0.09,
    position: [0, 0.15, 0],
    material: materials.white,
  });
  animated.push({ object: platter, speed: between(random, 0.12, 0.22), axis: 'y' });
  animated.push({ object: innerRing, speed: between(random, -0.2, -0.12), axis: 'z' });

  const railZ = between(random, 0.2, 0.65);
  const railY = between(random, 0.82, 1.16);
  const railAngle = between(random, -0.08, 0.08);
  addBox(group, materials, disposables, {
    size: [baseWidth + 0.65, 0.28, 0.5],
    position: [0, railY, railZ],
    material: materials.black,
    rotation: [0, railAngle, 0],
  });
  addBox(group, materials, disposables, {
    size: [baseWidth - 0.1, 0.025, 0.045],
    position: [0, railY + 0.16, railZ - 0.01],
    material: random() > 0.5 ? materials.cyan : materials.lime,
    edge: materials.edgeSoft,
    rotation: [0, railAngle, 0],
  });
  for (const x of [-baseWidth * 0.28, 0, baseWidth * 0.28]) {
    addSphere(group, materials, disposables, {
      radius: 0.09,
      position: [x, railY + 0.22, railZ],
      material: materials.hardware,
    });
  }

  const stepCount = 3 + Math.floor(random() * 3);
  for (let index = 0; index < stepCount; index += 1) {
    addBox(group, materials, disposables, {
      size: [0.62, 0.11, 0.46],
      position: [
        -baseWidth * 0.3 + index * 0.33,
        0.37 + index * 0.12,
        -baseDepth * 0.34 - index * 0.09,
      ],
      material: index % 2 ? materials.mid : materials.dark,
      edge: materials.edgeSoft,
    });
  }

  const conduitSide = random() > 0.5 ? 1 : -1;
  const conduitStartX = conduitSide * baseWidth * 0.18;
  const conduitEndX = conduitSide * baseWidth * 0.43;
  addConduit(
    group,
    materials,
    disposables,
    [
      [conduitStartX, 0.42, -baseDepth * 0.28],
      [conduitEndX, 0.75, -baseDepth * 0.4],
      [conduitEndX + conduitSide * 0.35, 1.12, 0.05],
      [conduitEndX, 0.78, baseDepth * 0.3],
    ],
    materials.cyan,
  );
  addSphere(group, materials, disposables, {
    radius: 0.13,
    position: [conduitEndX + conduitSide * 0.35, 1.12, 0.05],
    material: materials.lime,
  });

  if (random() > 0.38) {
    const antennaX = -conduitSide * baseWidth * 0.37;
    const antennaHeight = between(random, 1.0, 1.65);
    addCylinder(group, materials, disposables, {
      radius: 0.025,
      height: antennaHeight,
      position: [antennaX, 0.28 + antennaHeight / 2, -baseDepth * 0.34],
      material: materials.hardware,
      edge: materials.edgeSoft,
      segments: 12,
    });
    addSphere(group, materials, disposables, {
      radius: 0.09,
      position: [antennaX, 0.28 + antennaHeight, -baseDepth * 0.34],
      material: materials.cyan,
    });
  }

  group.rotation.y = between(random, -0.08, 0.08);
  const phase = between(random, 0, Math.PI * 2);

  return {
    group,
    update(time, reducedMotion) {
      if (!reducedMotion) {
        for (const item of animated) item.object.rotation[item.axis] = time * item.speed;
        materials.cyan.emissiveIntensity = 0.2 + Math.sin(time * 0.75 + phase) * 0.055;
        materials.lime.emissiveIntensity = 0.14 + Math.sin(time * 0.6 + phase + 1.4) * 0.035;
      }
    },
    dispose() {
      for (const item of disposables) item.dispose();
      for (const material of Object.values(materials)) material.dispose();
      group.removeFromParent();
    },
  };
}
