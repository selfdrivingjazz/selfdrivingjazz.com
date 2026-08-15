import * as THREE from 'three';

const COLORS = {
  edge: 0x8e9a96,
  edgeSoft: 0x46514d,
  black: 0x070a09,
  dark: 0x0f1513,
  mid: 0x1c2723,
  surface: 0x2b3833,
  cyan: 0x73ddd0,
  lime: 0xb9dc63,
  white: 0xe8ece5,
};

function createMaterials() {
  return {
    black: new THREE.MeshStandardMaterial({ color: COLORS.black, roughness: 0.72, metalness: 0.35 }),
    dark: new THREE.MeshStandardMaterial({ color: COLORS.dark, roughness: 0.66, metalness: 0.42 }),
    mid: new THREE.MeshStandardMaterial({ color: COLORS.mid, roughness: 0.58, metalness: 0.5 }),
    surface: new THREE.MeshStandardMaterial({ color: COLORS.surface, roughness: 0.52, metalness: 0.5 }),
    hardware: new THREE.MeshStandardMaterial({ color: COLORS.edge, roughness: 0.46, metalness: 0.62 }),
    cyan: new THREE.MeshStandardMaterial({
      color: COLORS.cyan,
      emissive: COLORS.cyan,
      emissiveIntensity: 0.2,
      roughness: 0.38,
      metalness: 0.35,
    }),
    lime: new THREE.MeshStandardMaterial({
      color: COLORS.lime,
      emissive: COLORS.lime,
      emissiveIntensity: 0.14,
      roughness: 0.4,
      metalness: 0.3,
    }),
    white: new THREE.MeshStandardMaterial({ color: COLORS.white, roughness: 0.52, metalness: 0.25 }),
    edge: new THREE.LineBasicMaterial({ color: COLORS.edge, transparent: true, opacity: 0.7 }),
    edgeSoft: new THREE.LineBasicMaterial({ color: COLORS.edgeSoft, transparent: true, opacity: 0.42 }),
  };
}

function applyTransform(object, position = [0, 0, 0], rotation = [0, 0, 0]) {
  object.position.set(...position);
  object.rotation.set(...rotation);
  return object;
}

export function createMachineKit(random) {
  const root = new THREE.Group();
  const materials = createMaterials();
  const disposables = [];
  const animations = [];

  function outlined(parent, geometry, material = materials.dark, edgeMaterial = materials.edge) {
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

  function box({
    parent = root,
    size,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    material = materials.dark,
    edge = materials.edge,
  }) {
    return applyTransform(
      outlined(parent, new THREE.BoxGeometry(...size), material, edge),
      position,
      rotation,
    );
  }

  function cylinder({
    parent = root,
    radius,
    height,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    material = materials.dark,
    edge = materials.edge,
    segments = 48,
  }) {
    return applyTransform(
      outlined(parent, new THREE.CylinderGeometry(radius, radius, height, segments), material, edge),
      position,
      rotation,
    );
  }

  function sphere({ parent = root, radius, position = [0, 0, 0], material = materials.cyan }) {
    const geometry = new THREE.SphereGeometry(radius, 24, 16);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.position.set(...position);
    parent.add(mesh);
    disposables.push(geometry);
    return mesh;
  }

  function torus({
    parent = root,
    radius,
    tube = 0.05,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    material = materials.cyan,
  }) {
    const geometry = new THREE.TorusGeometry(radius, tube, 12, 64);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    applyTransform(mesh, position, rotation);
    parent.add(mesh);
    disposables.push(geometry);
    return mesh;
  }

  function conduit({ parent = root, points, material = materials.cyan, radius = 0.055 }) {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
    const geometry = new THREE.TubeGeometry(curve, 48, radius, 10, false);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    parent.add(mesh);
    disposables.push(geometry);
    return mesh;
  }

  function chassis({
    parent = root,
    width,
    height,
    depth,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    material = materials.dark,
    inset = true,
  }) {
    const group = applyTransform(new THREE.Group(), position, rotation);
    parent.add(group);
    box({ parent: group, size: [width, height, depth], position: [0, height / 2, 0], material });
    if (inset) {
      box({
        parent: group,
        size: [width - 0.18, 0.035, depth - 0.18],
        position: [0, height + 0.022, 0],
        material: materials.black,
        edge: materials.edgeSoft,
      });
    }
    return group;
  }

  function keybed({
    parent = root,
    width = 2.4,
    depth = 1.15,
    keys = 8,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
  }) {
    const group = applyTransform(new THREE.Group(), position, rotation);
    parent.add(group);
    box({ parent: group, size: [width, 0.16, depth], position: [0, 0.08, 0], material: materials.black });
    const keyWidth = (width - 0.18) / keys;
    for (let index = 0; index < keys; index += 1) {
      const accented = index === Math.floor(keys * 0.62);
      box({
        parent: group,
        size: [keyWidth - 0.035, 0.055, depth - 0.18],
        position: [-width / 2 + 0.09 + keyWidth * (index + 0.5), 0.19, 0],
        material: accented ? materials.lime : index % 3 === 1 ? materials.mid : materials.surface,
        edge: materials.edgeSoft,
      });
    }
    return group;
  }

  function padBank({
    parent = root,
    columns = 4,
    rows = 3,
    cell = 0.34,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
  }) {
    const group = applyTransform(new THREE.Group(), position, rotation);
    parent.add(group);
    const width = columns * cell + 0.2;
    const depth = rows * cell + 0.2;
    box({ parent: group, size: [width, 0.15, depth], position: [0, 0.075, 0], material: materials.black });
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const active = (row * columns + column) % (columns + 1) === Math.floor(random() * 2);
        box({
          parent: group,
          size: [cell - 0.09, 0.055, cell - 0.09],
          position: [
            (column - (columns - 1) / 2) * cell,
            0.18,
            (row - (rows - 1) / 2) * cell,
          ],
          material: active ? materials.cyan : materials.mid,
          edge: materials.edgeSoft,
        });
      }
    }
    return group;
  }

  function patchBay({
    parent = root,
    width = 1.8,
    height = 1.05,
    columns = 5,
    rows = 3,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
  }) {
    const group = applyTransform(new THREE.Group(), position, rotation);
    parent.add(group);
    box({ parent: group, size: [width, height, 0.18], position: [0, height / 2, 0], material: materials.black });
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        sphere({
          parent: group,
          radius: 0.045,
          position: [
            (column - (columns - 1) / 2) * (width / (columns + 1)),
            height * 0.24 + row * (height * 0.24),
            0.115,
          ],
          material: (row + column) % 7 === 0 ? materials.lime : materials.hardware,
        });
      }
    }
    return group;
  }

  function rotor({
    parent = root,
    radius = 0.7,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    vertical = false,
    speed = 0.18,
  }) {
    const group = applyTransform(new THREE.Group(), position, rotation);
    parent.add(group);
    if (vertical) group.rotation.x += Math.PI / 2;
    const spinner = new THREE.Group();
    group.add(spinner);
    cylinder({ parent: spinner, radius, height: 0.14, material: materials.black, segments: 64 });
    torus({ parent: spinner, radius: radius * 0.91, tube: 0.05, position: [0, 0.085, 0], rotation: [Math.PI / 2, 0, 0] });
    torus({
      parent: spinner,
      radius: radius * 0.34,
      tube: 0.045,
      position: [0, 0.1, 0],
      rotation: [Math.PI / 2, 0, 0],
      material: materials.lime,
    });
    sphere({ parent: spinner, radius: 0.07, position: [0, 0.145, 0], material: materials.white });
    animations.push((time) => { spinner.rotation.y = time * speed; });
    return group;
  }

  function reelDeck({
    parent = root,
    width = 2.5,
    height = 1.65,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
  }) {
    const group = applyTransform(new THREE.Group(), position, rotation);
    parent.add(group);
    box({ parent: group, size: [width, height, 0.24], position: [0, height / 2, 0], material: materials.dark });
    for (const [index, x] of [-width * 0.26, width * 0.26].entries()) {
      const spinner = new THREE.Group();
      spinner.position.set(x, height * 0.62, 0.17);
      spinner.rotation.x = Math.PI / 2;
      group.add(spinner);
      cylinder({ parent: spinner, radius: height * 0.27, height: 0.12, material: materials.black, segments: 48 });
      torus({ parent: spinner, radius: height * 0.22, tube: 0.045, position: [0, 0.075, 0], rotation: [Math.PI / 2, 0, 0], material: index ? materials.lime : materials.cyan });
      sphere({ parent: spinner, radius: 0.06, position: [0, 0.14, 0], material: materials.white });
      animations.push((time) => { spinner.rotation.y = time * (index ? -0.19 : 0.23); });
    }
    return group;
  }

  function speaker({
    parent = root,
    radius = 0.55,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
  }) {
    const group = applyTransform(new THREE.Group(), position, rotation);
    parent.add(group);
    const coneGeometry = new THREE.ConeGeometry(radius, radius * 0.9, 32, 1, true);
    const cone = new THREE.Mesh(coneGeometry, materials.dark);
    cone.rotation.x = Math.PI / 2;
    cone.position.z = radius * 0.22;
    group.add(cone);
    torus({ parent: group, radius, tube: 0.05, position: [0, 0, radius * 0.63], material: materials.cyan });
    sphere({ parent: group, radius: radius * 0.12, position: [0, 0, radius * 0.66], material: materials.lime });
    disposables.push(coneGeometry);
    return group;
  }

  function bridge({
    parent = root,
    length = 4.8,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    nodes = 4,
  }) {
    const group = applyTransform(new THREE.Group(), position, rotation);
    parent.add(group);
    box({ parent: group, size: [length, 0.28, 0.5], position: [0, 0.14, 0], material: materials.black });
    box({ parent: group, size: [length - 0.28, 0.025, 0.045], position: [0, 0.3, 0], material: materials.cyan, edge: materials.edgeSoft });
    for (let index = 0; index < nodes; index += 1) {
      sphere({
        parent: group,
        radius: 0.075,
        position: [-length * 0.38 + (length * 0.76 * index) / Math.max(1, nodes - 1), 0.34, 0],
        material: index === nodes - 1 ? materials.lime : materials.hardware,
      });
    }
    return group;
  }

  function antenna({
    parent = root,
    height = 1.4,
    position = [0, 0, 0],
    material = materials.cyan,
  }) {
    const group = applyTransform(new THREE.Group(), position);
    parent.add(group);
    cylinder({ parent: group, radius: 0.025, height, position: [0, height / 2, 0], material: materials.hardware, edge: materials.edgeSoft, segments: 12 });
    sphere({ parent: group, radius: 0.085, position: [0, height, 0], material });
    return group;
  }

  function drum({
    parent = root,
    radius = 1,
    height = 0.8,
    position = [0, 0, 0],
    material = materials.mid,
  }) {
    const group = applyTransform(new THREE.Group(), position);
    parent.add(group);
    cylinder({ parent: group, radius, height, position: [0, height / 2, 0], material, segments: 64 });
    torus({ parent: group, radius: radius * 0.86, tube: 0.04, position: [0, height + 0.04, 0], rotation: [Math.PI / 2, 0, 0], material: materials.cyan });
    return group;
  }

  function finish(phase) {
    root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);
    const largest = Math.max(size.x, size.z, size.y * 1.25);
    const scale = Math.min(1, 6.4 / largest);
    root.scale.setScalar(scale);
    root.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);

    return {
      group: root,
      update(time, reducedMotion) {
        if (!reducedMotion) {
          for (const animate of animations) animate(time);
          materials.cyan.emissiveIntensity = 0.19 + Math.sin(time * 0.72 + phase) * 0.045;
          materials.lime.emissiveIntensity = 0.13 + Math.sin(time * 0.57 + phase + 1.2) * 0.03;
        }
      },
      dispose() {
        for (const item of disposables) item.dispose();
        for (const material of Object.values(materials)) material.dispose();
        root.removeFromParent();
      },
    };
  }

  return {
    root,
    materials,
    box,
    cylinder,
    sphere,
    conduit,
    chassis,
    keybed,
    padBank,
    patchBay,
    rotor,
    torus,
    reelDeck,
    speaker,
    bridge,
    antenna,
    drum,
    finish,
  };
}
