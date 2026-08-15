import * as THREE from 'three';

import { createMachineKit } from './components.js';
import { createSeededRandom, generateMachinePlan } from './grammar.js';

function between(random, minimum, maximum) {
  return minimum + (maximum - minimum) * random();
}

function structuralLink(kit, from, to, material) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const direction = end.clone().sub(start);
  const length = direction.length();
  const beam = kit.cylinder({
    radius: 0.026,
    height: length,
    position: start.clone().add(end).multiplyScalar(0.5).toArray(),
    material,
    edge: kit.materials.edgeSoft,
    segments: 10,
  });
  beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
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

function addTopologyStructure(kit, plan) {
  for (const [index, [fromIndex, toIndex]] of plan.edges.entries()) {
    if (index % 2 !== 0 && plan.topology.id !== 'bridge') continue;
    const fromModule = plan.modules[fromIndex];
    const toModule = plan.modules[toIndex];
    const from = [fromModule.position[0], fromModule.position[1] + fromModule.size[1] * 0.45, fromModule.position[2]];
    const to = [toModule.position[0], toModule.position[1] + toModule.size[1] * 0.45, toModule.position[2]];
    structuralLink(kit, from, to, index % 3 === 0 ? kit.materials.primary : kit.materials.hardware);
  }

  for (const cable of plan.cables) {
    kit.cable({
      start: cable.from,
      end: cable.to,
      lift: cable.lift,
      radius: cable.radius,
      material: cable.material === 'secondary' ? kit.materials.secondary : kit.materials.primary,
    });
  }
}

function withEvolution(machine, random) {
  const parts = machine.evolvable.map((object, index) => ({
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
      part.targetLift = between(random, 0.08, 0.42);
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
  for (const [index, module] of plan.modules.entries()) buildModule(kit, module, random, index);
  addTopologyStructure(kit, plan);
  const machine = kit.finish(plan.phase);
  return {
    ...withEvolution(machine, random),
    family: { id: plan.topology.id, name: plan.specimen },
    plan,
  };
}
