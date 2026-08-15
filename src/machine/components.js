import * as THREE from 'three';

const DEFAULT_PALETTE = {
  black: 0x070a09,
  dark: 0x0f1513,
  mid: 0x1c2723,
  surface: 0x2b3833,
  hardware: 0x8e9a96,
  primary: 0x73ddd0,
  secondary: 0xb9dc63,
  white: 0xe8ece5,
};

function createMaterials(palette = DEFAULT_PALETTE) {
  const primary = new THREE.MeshStandardMaterial({
    color: palette.primary,
    emissive: palette.primary,
    emissiveIntensity: 0.2,
    roughness: 0.38,
    metalness: 0.35,
  });
  const secondary = new THREE.MeshStandardMaterial({
    color: palette.secondary,
    emissive: palette.secondary,
    emissiveIntensity: 0.14,
    roughness: 0.4,
    metalness: 0.3,
  });
  return {
    black: new THREE.MeshStandardMaterial({ color: palette.black, roughness: 0.72, metalness: 0.35 }),
    dark: new THREE.MeshStandardMaterial({ color: palette.dark, roughness: 0.66, metalness: 0.42 }),
    mid: new THREE.MeshStandardMaterial({ color: palette.mid, roughness: 0.58, metalness: 0.5 }),
    surface: new THREE.MeshStandardMaterial({ color: palette.surface, roughness: 0.52, metalness: 0.5 }),
    hardware: new THREE.MeshStandardMaterial({ color: palette.hardware, roughness: 0.46, metalness: 0.62 }),
    primary,
    secondary,
    white: new THREE.MeshStandardMaterial({ color: palette.white, roughness: 0.52, metalness: 0.25 }),
    edge: new THREE.LineBasicMaterial({ color: palette.hardware, transparent: true, opacity: 0.7 }),
    edgeSoft: new THREE.LineBasicMaterial({ color: palette.hardware, transparent: true, opacity: 0.32 }),
  };
}

function applyTransform(object, position = [0, 0, 0], rotation = [0, 0, 0]) {
  object.position.set(...position);
  object.rotation.set(...rotation);
  return object;
}

export function createMachineKit(random, palette) {
  const root = new THREE.Group();
  const materials = createMaterials(palette);
  const disposables = [];
  const animations = [];
  const evolvable = [];
  const interactions = [];

  function registerInteraction(target, activate) {
    interactions.push({ target, activate });
    return target;
  }

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

  function sphere({ parent = root, radius, position = [0, 0, 0], material = materials.primary }) {
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
    material = materials.primary,
  }) {
    const geometry = new THREE.TorusGeometry(radius, tube, 12, 64);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    applyTransform(mesh, position, rotation);
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
      const restingY = 0.19;
      const key = box({
        parent: group,
        size: [keyWidth - 0.035, 0.055, depth - 0.18],
        position: [-width / 2 + 0.09 + keyWidth * (index + 0.5), restingY, 0],
        material: accented ? materials.secondary : index % 3 === 1 ? materials.mid : materials.surface,
        edge: materials.edgeSoft,
      });
      let depressed = false;
      registerInteraction(key, () => {
        depressed = !depressed;
        key.position.y = restingY - (depressed ? 0.055 : 0);
        key.material = depressed ? materials.primary : accented ? materials.secondary : index % 3 === 1 ? materials.mid : materials.surface;
      });
    }
    evolvable.push(group);
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
        let active = (row * columns + column) % (columns + 1) === Math.floor(random() * 2);
        const restingY = 0.18;
        const pad = box({
          parent: group,
          size: [cell - 0.09, 0.055, cell - 0.09],
          position: [
            (column - (columns - 1) / 2) * cell,
            restingY,
            (row - (rows - 1) / 2) * cell,
          ],
          material: active ? materials.primary : materials.mid,
          edge: materials.edgeSoft,
        });
        registerInteraction(pad, () => {
          active = !active;
          pad.material = active ? materials.primary : materials.mid;
          pad.position.y = restingY + (active ? 0.045 : 0);
        });
      }
    }
    evolvable.push(group);
    return group;
  }

  function faderBank({
    parent = root,
    channels = 5,
    spacing = 0.36,
    travel = 0.9,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
  }) {
    const group = applyTransform(new THREE.Group(), position, rotation);
    parent.add(group);
    const width = channels * spacing + 0.25;
    box({ parent: group, size: [width, 0.15, travel + 0.28], position: [0, 0.075, 0], material: materials.black });
    for (let index = 0; index < channels; index += 1) {
      const x = (index - (channels - 1) / 2) * spacing;
      box({ parent: group, size: [0.035, 0.022, travel], position: [x, 0.17, 0], material: materials.hardware, edge: materials.edgeSoft });
      let value = random();
      const handle = box({
        parent: group,
        size: [0.18, 0.12, 0.24],
        position: [x, 0.24, (value - 0.5) * travel * 0.74],
        material: index % 3 === 0 ? materials.secondary : materials.surface,
        edge: materials.edgeSoft,
      });
      registerInteraction(handle, () => {
        value = (value + 0.25) % 1.25;
        if (value > 1) value = 0;
        handle.position.z = (value - 0.5) * travel * 0.74;
      });
    }
    evolvable.push(group);
    return group;
  }

  function knobBank({
    parent = root,
    count = 5,
    spacing = 0.42,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
  }) {
    const group = applyTransform(new THREE.Group(), position, rotation);
    parent.add(group);
    const width = count * spacing + 0.2;
    box({ parent: group, size: [width, 0.14, 0.58], position: [0, 0.07, 0], material: materials.black });
    for (let index = 0; index < count; index += 1) {
      const control = new THREE.Group();
      control.position.set((index - (count - 1) / 2) * spacing, 0, 0);
      group.add(control);
      cylinder({ parent: control, radius: 0.12, height: 0.13, position: [0, 0.19, 0], material: materials.hardware, edge: materials.edgeSoft, segments: 32 });
      box({
        parent: control,
        size: [0.025, 0.035, 0.1],
        position: [0, 0.27, -0.045],
        material: index % 2 === 0 ? materials.primary : materials.secondary,
        edge: materials.edgeSoft,
      });
      control.rotation.y = random() * Math.PI * 1.5 - Math.PI * 0.75;
      registerInteraction(control, () => {
        control.rotation.y = THREE.MathUtils.clamp(
          control.rotation.y + Math.PI * 0.28,
          -Math.PI * 0.75,
          Math.PI * 0.75,
        );
        if (control.rotation.y >= Math.PI * 0.74) control.rotation.y = -Math.PI * 0.75;
      });
    }
    evolvable.push(group);
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
          material: (row + column) % 7 === 0 ? materials.secondary : materials.hardware,
        });
      }
    }
    evolvable.push(group);
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
      material: materials.secondary,
    });
    sphere({ parent: spinner, radius: 0.07, position: [0, 0.145, 0], material: materials.white });
    animations.push((time) => { spinner.rotation.y = time * speed; });
    evolvable.push(group);
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
      torus({ parent: spinner, radius: height * 0.22, tube: 0.045, position: [0, 0.075, 0], rotation: [Math.PI / 2, 0, 0], material: index ? materials.secondary : materials.primary });
      sphere({ parent: spinner, radius: 0.06, position: [0, 0.14, 0], material: materials.white });
      animations.push((time) => { spinner.rotation.y = time * (index ? -0.19 : 0.23); });
    }
    evolvable.push(group);
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
    torus({ parent: group, radius, tube: 0.05, position: [0, 0, radius * 0.63], material: materials.primary });
    const driver = sphere({ parent: group, radius: radius * 0.12, position: [0, 0, radius * 0.66], material: materials.secondary });
    const phase = random() * Math.PI * 2;
    animations.push((time) => {
      const pulse = 1 + Math.sin(time * 2.4 + phase) * 0.09;
      cone.scale.y = pulse;
      driver.scale.setScalar(1 + Math.sin(time * 2.4 + phase) * 0.14);
    });
    disposables.push(coneGeometry);
    evolvable.push(group);
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
    box({ parent: group, size: [length - 0.28, 0.025, 0.045], position: [0, 0.3, 0], material: materials.primary, edge: materials.edgeSoft });
    for (let index = 0; index < nodes; index += 1) {
      const restingY = 0.34;
      const node = sphere({
        parent: group,
        radius: 0.075,
        position: [-length * 0.38 + (length * 0.76 * index) / Math.max(1, nodes - 1), restingY, 0],
        material: index === nodes - 1 ? materials.secondary : materials.hardware,
      });
      const phase = (index / Math.max(1, nodes)) * Math.PI * 2;
      animations.push((time) => {
        node.position.y = restingY + Math.sin(time * 1.1 + phase) * 0.045;
        node.position.z = Math.cos(time * 0.7 + phase) * 0.04;
      });
    }
    evolvable.push(group);
    return group;
  }

  function antenna({
    parent = root,
    height = 1.4,
    position = [0, 0, 0],
    material = materials.primary,
  }) {
    const group = applyTransform(new THREE.Group(), position);
    parent.add(group);
    cylinder({ parent: group, radius: 0.025, height, position: [0, height / 2, 0], material: materials.hardware, edge: materials.edgeSoft, segments: 12 });
    const receiver = sphere({ parent: group, radius: 0.085, position: [0, height, 0], material });
    const phase = random() * Math.PI * 2;
    animations.push((time) => {
      receiver.scale.setScalar(1 + Math.sin(time * 1.6 + phase) * 0.16);
    });
    evolvable.push(group);
    return group;
  }

  function screen({
    parent = root,
    width = 1.1,
    depth = 0.72,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
  }) {
    const group = applyTransform(new THREE.Group(), position, rotation);
    parent.add(group);
    box({ parent: group, size: [width, 0.14, depth], position: [0, 0.07, 0], material: materials.black });
    const glass = box({
      parent: group,
      size: [width - 0.16, 0.035, depth - 0.16],
      position: [0, 0.16, 0],
      material: materials.primary,
      edge: materials.edgeSoft,
    });
    const bars = Array.from({ length: 5 }, (_, index) => box({
      parent: group,
      size: [width * random.between(0.2, 0.68), 0.018, 0.025],
      position: [random.between(-0.12, 0.12), 0.185, -depth * 0.28 + index * depth * 0.13],
      material: index === 4 ? materials.secondary : materials.white,
      edge: materials.edgeSoft,
    }));
    let mode = 0;
    registerInteraction(glass, () => {
      mode = (mode + 1) % 3;
      glass.material = mode === 1 ? materials.secondary : mode === 2 ? materials.dark : materials.primary;
      for (const [index, bar] of bars.entries()) bar.scale.x = 0.35 + ((index + mode) % 4) * 0.22;
    });
    evolvable.push(group);
    return group;
  }

  function toggleBank({
    parent = root,
    count = 4,
    spacing = 0.3,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
  }) {
    const group = applyTransform(new THREE.Group(), position, rotation);
    parent.add(group);
    box({ parent: group, size: [count * spacing + 0.18, 0.13, 0.5], position: [0, 0.065, 0], material: materials.black });
    for (let index = 0; index < count; index += 1) {
      const lever = new THREE.Group();
      lever.position.set((index - (count - 1) / 2) * spacing, 0.13, 0);
      group.add(lever);
      const hit = cylinder({ parent: lever, radius: 0.075, height: 0.12, position: [0, 0.06, 0], material: materials.hardware, segments: 16 });
      let on = index % 3 === 0;
      lever.rotation.z = on ? -0.34 : 0.34;
      registerInteraction(hit, () => {
        on = !on;
        lever.rotation.z = on ? -0.34 : 0.34;
        hit.material = on ? materials.secondary : materials.hardware;
      });
    }
    evolvable.push(group);
    return group;
  }

  function joystick({
    parent = root,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
  }) {
    const group = applyTransform(new THREE.Group(), position, rotation);
    parent.add(group);
    cylinder({ parent: group, radius: 0.28, height: 0.12, position: [0, 0.06, 0], material: materials.black, segments: 32 });
    const stick = new THREE.Group();
    stick.position.y = 0.12;
    group.add(stick);
    cylinder({ parent: stick, radius: 0.035, height: 0.42, position: [0, 0.21, 0], material: materials.hardware, segments: 12 });
    const handle = sphere({ parent: stick, radius: 0.12, position: [0, 0.46, 0], material: materials.secondary });
    let direction = 0;
    registerInteraction(handle, () => {
      direction = (direction + 1) % 5;
      const angle = direction === 4 ? 0 : (direction / 4) * Math.PI * 2;
      stick.rotation.x = direction === 4 ? 0 : Math.cos(angle) * 0.32;
      stick.rotation.z = direction === 4 ? 0 : Math.sin(angle) * 0.32;
    });
    evolvable.push(group);
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
    torus({ parent: group, radius: radius * 0.86, tube: 0.04, position: [0, height + 0.04, 0], rotation: [Math.PI / 2, 0, 0], material: materials.primary });
    return group;
  }

  function finish(phase) {
    root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    const sphere = new THREE.Sphere();
    bounds.getSize(size);
    bounds.getCenter(center);
    bounds.getBoundingSphere(sphere);
    const largest = Math.max(size.x, size.z, size.y * 1.25);
    const scale = Math.min(1, 6.4 / largest);
    root.scale.setScalar(scale);
    root.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);

    return {
      group: root,
      interactions,
      evolvable,
      viewRadius: sphere.radius * scale,
      viewCenterY: (sphere.center.y - bounds.min.y) * scale,
      update(time, reducedMotion) {
        if (!reducedMotion) {
          for (const animate of animations) animate(time);
          materials.primary.emissiveIntensity = 0.19 + Math.sin(time * 0.72 + phase) * 0.045;
          materials.secondary.emissiveIntensity = 0.13 + Math.sin(time * 0.57 + phase + 1.2) * 0.03;
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
    evolvable,
    box,
    cylinder,
    sphere,
    chassis,
    keybed,
    padBank,
    faderBank,
    knobBank,
    patchBay,
    rotor,
    torus,
    reelDeck,
    speaker,
    bridge,
    antenna,
    screen,
    toggleBank,
    joystick,
    drum,
    finish,
  };
}
