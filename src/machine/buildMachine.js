import * as THREE from 'three';

import { createMachineKit } from './components.js';
import { createSeededRandom, generateMachinePlan } from './grammar.js';

function between(random, minimum, maximum) {
  return minimum + (maximum - minimum) * random();
}

function connectorPort(module, toward) {
  const [width, height, depth] = module.size;
  const origin = new THREE.Vector3(module.position[0], module.position[1] + height * 0.52, module.position[2]);
  const verticalDirection = Math.sign(toward.y - origin.y) || 1;
  const direction = toward.clone().sub(origin).setY(0);
  if (direction.lengthSq() < 0.001) direction.set(verticalDirection, 0, 0);
  direction.normalize();
  if (module.form === 'drum') {
    return { origin, direction, distance: Math.min(width, depth) * 0.5 };
  }
  const cosine = Math.cos(module.rotation);
  const sine = Math.sin(module.rotation);
  const localX = direction.x * cosine - direction.z * sine;
  const localZ = direction.x * sine + direction.z * cosine;
  const xDistance = Math.abs(localX) < 0.001 ? Infinity : width / 2 / Math.abs(localX);
  const zDistance = Math.abs(localZ) < 0.001 ? Infinity : depth / 2 / Math.abs(localZ);
  return { origin, direction, distance: Math.min(xDistance, zDistance) };
}

function addJointMarker(kit, parent, module, toward, material) {
  const { origin, direction, distance } = connectorPort(module, toward);
  const surface = origin.clone().addScaledVector(direction, distance);
  const stemLength = 0.18;
  parent.updateWorldMatrix(true, false);
  const worldRotation = parent.getWorldQuaternion(new THREE.Quaternion());
  const localDirection = direction.clone().applyQuaternion(worldRotation.invert());
  const localSurface = parent.worldToLocal(surface.clone());
  const stem = kit.cylinder({
    parent,
    radius: 0.045,
    height: stemLength,
    position: localSurface.clone().addScaledVector(localDirection, stemLength / 2).toArray(),
    material: kit.materials.hardware,
    edge: kit.materials.edgeSoft,
    segments: 16,
  });
  stem.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), localDirection);
  kit.sphere({ parent, radius: 0.09, position: localSurface.toArray(), material: kit.materials.hardware });
  kit.sphere({ parent, radius: 0.07, position: localSurface.clone().addScaledVector(localDirection, stemLength).toArray(), material });
}

function addFeet(kit, parent, module) {
  if (!module.legs) return;
  const [width, , depth] = module.size;
  const height = Math.max(0.45, module.position[1]);
  for (const x of [-width * 0.34, width * 0.34]) {
    for (const z of [-depth * 0.32, depth * 0.32]) {
      kit.box({
        parent,
        size: [0.12, height, 0.12],
        position: [x, -height / 2, z],
        rotation: [0, 0, x * 0.08],
        material: kit.materials.hardware,
        edge: kit.materials.edgeSoft,
      });
    }
  }
}

function addRoleControls(kit, parent, module, random) {
  const [width, height, depth] = module.size;
  const top = [0, height + 0.06, 0];
  const compactWidth = Math.max(0.72, width * 0.78);

  if (module.role === 'sequencer') {
    const columns = Math.max(3, Math.min(7, Math.floor(width / 0.27)));
    kit.padBank({ parent, columns, rows: depth > 1.1 ? 2 : 1, cell: Math.min(0.31, compactWidth / columns), position: top });
    return;
  }
  if (module.role === 'mixer') {
    const channels = Math.max(2, Math.min(5, Math.floor(width / 0.34)));
    kit.faderBank({ parent, channels, spacing: Math.min(0.3, compactWidth / channels), travel: Math.min(0.68, depth * 0.56), position: top });
    if (width > 1.35) kit.knobBank({ parent, count: channels, spacing: Math.min(0.3, compactWidth / channels), position: [0, height + 0.08, -depth * 0.34] });
    return;
  }
  if (module.role === 'patch') {
    kit.patchBay({
      parent,
      width: width * 0.76,
      height: height * 0.74,
      columns: Math.max(3, Math.floor(width / 0.3)),
      rows: 2,
      position: [0, height * 0.12, depth / 2 + 0.1],
    });
    return;
  }
  if (module.role === 'reel' && width > 1.25) {
    kit.reelDeck({ parent, width: width * 0.82, height: Math.max(0.62, height * 0.9), position: [0, height * 0.12, depth / 2 + 0.08] });
    return;
  }
  if (module.role === 'speaker') {
    const radius = Math.min(width, height + 0.35) * 0.3;
    kit.speaker({ parent, radius, position: [0, height * 0.52, depth / 2 + radius * 0.15] });
    return;
  }
  if (module.role === 'scanner') {
    kit.screen({ parent, width: compactWidth, depth: Math.min(0.68, depth * 0.65), position: top });
    if (random() > 0.45) kit.antenna({ parent, height: between(random, 0.48, 0.95), position: [width * 0.34, height, -depth * 0.25], material: module.accent === 'secondary' ? kit.materials.secondary : kit.materials.primary });
    return;
  }
  if (module.role === 'keys') {
    kit.keybed({ parent, width: compactWidth, depth: Math.min(0.82, depth * 0.72), keys: Math.max(4, Math.floor(width / 0.2)), position: top });
    return;
  }
  const toggles = Math.max(2, Math.min(5, Math.floor(width / 0.28)));
  kit.toggleBank({ parent, count: toggles, spacing: Math.min(0.28, compactWidth / toggles), position: [0, height + 0.06, -depth * 0.14] });
  if (depth > 1.05) kit.joystick({ parent, position: [0, height + 0.06, depth * 0.3] });
}

function buildModule(kit, module, random, index) {
  const parent = new THREE.Group();
  parent.position.set(...module.position);
  parent.rotation.y = module.rotation;
  kit.root.add(parent);
  const [width, height, depth] = module.size;
  const bodyMaterial = index % 3 === 0 ? kit.materials.surface : index % 2 === 0 ? kit.materials.mid : kit.materials.dark;

  addFeet(kit, parent, module);
  if (module.plinth) {
    if (module.form === 'drum') {
      kit.cylinder({ parent, radius: Math.min(width, depth) * 0.58, height: 0.12, position: [0, -0.06, 0], material: kit.materials.black, segments: 40 });
    } else {
      kit.box({ parent, size: [width + 0.18, 0.12, depth + 0.18], position: [0, -0.06, 0], material: kit.materials.black });
    }
  }

  if (module.form === 'drum') {
    kit.drum({ parent, radius: Math.min(width, depth) * 0.5, height, material: bodyMaterial });
  } else {
    kit.chassis({ parent, width, height, depth, material: bodyMaterial });
    if (random() > 0.38) {
      kit.box({
        parent,
        size: [width * between(random, 0.35, 0.72), 0.025, 0.04],
        position: [between(random, -width * 0.08, width * 0.08), height + 0.055, -depth * 0.42],
        material: module.accent === 'secondary' ? kit.materials.secondary : kit.materials.primary,
        edge: kit.materials.edgeSoft,
      });
    }
  }
  addRoleControls(kit, parent, module, random);
  kit.evolvable.push(parent);
  return parent;
}

function addTopologyJoints(kit, plan, moduleGroups) {
  for (const [index, [fromIndex, toIndex]] of plan.edges.entries()) {
    const fromModule = plan.modules[fromIndex];
    const toModule = plan.modules[toIndex];
    const fromCenter = new THREE.Vector3(...fromModule.position);
    const toCenter = new THREE.Vector3(...toModule.position);
    const material = index % 2 === 0 ? kit.materials.primary : kit.materials.secondary;
    addJointMarker(kit, moduleGroups[fromIndex], fromModule, toCenter, material);
    addJointMarker(kit, moduleGroups[toIndex], toModule, fromCenter, material);
  }
}

function withEvolution(machine, random) {
  const parts = machine.evolvable
    .filter((object) => object.parent === machine.group)
    .map((object, index) => ({
      object,
      basePosition: object.position.clone(),
      baseRotationY: object.rotation.y,
      baseRotationZ: object.rotation.z,
      lift: 0,
      targetLift: 0,
      turn: 0,
      targetTurn: 0,
      tilt: 0,
      targetTilt: 0,
      phase: random() * Math.PI * 2,
      index,
    }));
  const baseUpdate = machine.update;
  let previousTime = 0;
  let nextMutation = between(random, 3.4, 5.2);

  function reconfigure(time) {
    for (const part of parts) {
      part.targetLift = 0;
      part.targetTurn = 0;
      part.targetTilt = 0;
    }
    const candidates = [...parts];
    const count = Math.min(candidates.length, 1 + Math.floor(random() * 3));
    for (let index = 0; index < count; index += 1) {
      const candidateIndex = Math.floor(random() * candidates.length);
      const [part] = candidates.splice(candidateIndex, 1);
      part.targetLift = between(random, 0.06, 0.3);
      part.targetTurn = between(random, -0.22, 0.22);
      part.targetTilt = between(random, -0.08, 0.08);
    }
    nextMutation = time + between(random, 4.2, 7.0);
  }

  return {
    ...machine,
    update(time, reducedMotion, evolution) {
      baseUpdate(time, reducedMotion);
      const delta = previousTime === 0 ? 0 : Math.min(0.1, time - previousTime);
      previousTime = time;
      if (evolution && !reducedMotion && time >= nextMutation && parts.length > 0) reconfigure(time);
      for (const part of parts) {
        const targetLift = evolution && !reducedMotion ? part.targetLift : 0;
        const targetTurn = evolution && !reducedMotion ? part.targetTurn : 0;
        const targetTilt = evolution && !reducedMotion ? part.targetTilt : 0;
        const damping = 1 - Math.exp(-delta * 1.8);
        part.lift += (targetLift - part.lift) * damping;
        part.turn += (targetTurn - part.turn) * damping;
        part.tilt += (targetTilt - part.tilt) * damping;
        part.object.position.copy(part.basePosition);
        part.object.position.y += part.lift + Math.sin(time * 0.55 + part.phase) * part.lift * 0.08;
        part.object.rotation.y = part.baseRotationY + part.turn;
        part.object.rotation.z = part.baseRotationZ + part.tilt;
      }
      if ((!evolution || reducedMotion) && nextMutation <= time) nextMutation = time + between(random, 3.4, 5.2);
    },
  };
}

export function buildMachine(seed) {
  const plan = generateMachinePlan(seed);
  const random = createSeededRandom(seed);
  const kit = createMachineKit(random, plan.palette);
  const moduleGroups = plan.modules.map((module, index) => buildModule(kit, module, random, index));
  addTopologyJoints(kit, plan, moduleGroups);
  const machine = kit.finish(plan.phase);
  return {
    ...withEvolution(machine, random),
    family: { id: plan.topology.id, name: plan.specimen },
    plan,
  };
}
