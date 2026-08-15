import { createMachineKit } from './components.js';
import { familyForSeed } from './spec.js';

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

function signalConsole(kit, random) {
  const { materials } = kit;
  kit.chassis({ width: 6.2, height: 0.34, depth: 3.8, material: materials.dark });
  kit.keybed({ width: between(random, 2.3, 2.8), depth: 1.25, keys: 9, position: [-1.55, 0.38, 0.7] });
  kit.padBank({ columns: 4, rows: 3, cell: 0.34, position: [1.55, 0.38, 0.78] });
  kit.patchBay({ width: 2.2, height: 1.15, columns: 6, rows: 3, position: [-0.45, 0.42, -1.48] });
  kit.chassis({ width: 1.75, height: 1.25, depth: 1.25, position: [1.65, 0.38, -1.25], material: materials.mid });
  kit.rotor({ radius: 0.67, position: [1.65, 1.95, -0.58], vertical: true, speed: 0.21 });
  kit.bridge({ length: 5.75, position: [0, 1.02, 0.12], rotation: [0, -0.05, 0], nodes: 5 });
  kit.conduit({
    points: [[-0.9, 1.35, -1.35], [-0.3, 1.72, -0.7], [0.8, 1.5, -0.1], [1.7, 0.62, 0.65]],
    material: materials.cyan,
  });
  kit.antenna({ height: 1.25, position: [-2.65, 0.38, -1.25], material: materials.lime });
}

function relayTower(kit, random) {
  const { materials } = kit;
  kit.drum({ radius: 2.2, height: 0.34, material: materials.dark });
  kit.chassis({ width: 3.2, height: 0.6, depth: 2.7, position: [0, 0.34, 0], material: materials.mid });
  kit.chassis({ width: 2.45, height: 0.8, depth: 2.05, position: [0.15, 0.95, -0.05], material: materials.surface });
  kit.chassis({ width: 1.65, height: 0.72, depth: 1.42, position: [-0.05, 1.76, -0.05], material: materials.dark });
  kit.patchBay({ width: 1.45, height: 0.75, columns: 4, rows: 2, position: [0, 1.82, 0.72] });
  kit.speaker({ radius: between(random, 0.64, 0.82), position: [0, 2.82, 0.78] });
  kit.speaker({ radius: 0.48, position: [-1.72, 1.48, 0.3], rotation: [0, -Math.PI / 2, 0] });
  kit.bridge({ length: 3.8, position: [0, 1.35, 0.95], rotation: [0, 0, Math.PI / 2], nodes: 3 });
  kit.antenna({ height: between(random, 1.4, 1.9), position: [1.48, 0.96, -0.75] });
  kit.antenna({ height: between(random, 0.9, 1.3), position: [-1.35, 0.96, -0.8], material: materials.lime });
  kit.conduit({
    points: [[-1.45, 0.55, -0.5], [-2.05, 1.15, -0.3], [-1.65, 2.1, 0.25], [-0.72, 2.32, 0.55]],
    material: materials.cyan,
    radius: 0.07,
  });
}

function twinDeck(kit, random) {
  const { materials } = kit;
  const separation = between(random, 1.75, 2.05);
  kit.chassis({ width: 2.65, height: 0.38, depth: 3.15, position: [-separation, 0, 0], material: materials.dark });
  kit.chassis({ width: 2.65, height: 0.38, depth: 3.15, position: [separation, 0, 0], material: materials.dark });
  kit.chassis({ width: 1.8, height: 0.72, depth: 1.45, position: [-separation, 0.38, -0.55], material: materials.mid });
  kit.chassis({ width: 1.8, height: 0.95, depth: 1.45, position: [separation, 0.38, -0.55], material: materials.surface });
  kit.rotor({ radius: 0.63, position: [-separation, 1.42, -0.55], speed: 0.24 });
  kit.rotor({ radius: 0.63, position: [separation, 1.65, -0.55], speed: -0.19 });
  kit.keybed({ width: 2.1, depth: 1.15, keys: 7, position: [-separation, 0.44, 0.85] });
  kit.padBank({ columns: 4, rows: 2, cell: 0.36, position: [separation, 0.44, 0.85] });
  kit.bridge({ length: separation * 2.05, position: [0, 1.16, 0.12], nodes: 4 });
  kit.conduit({
    points: [[-separation, 0.72, -1.2], [-0.8, 1.85, -1.55], [0.8, 1.85, -1.55], [separation, 0.9, -1.2]],
    material: materials.lime,
  });
  kit.antenna({ height: 1.0, position: [-separation - 0.9, 0.38, -1.15] });
  kit.antenna({ height: 1.0, position: [separation + 0.9, 0.38, -1.15], material: materials.lime });
}

function radialEngine(kit, random) {
  const { materials } = kit;
  kit.drum({ radius: 2.65, height: 0.32, material: materials.dark });
  kit.drum({ radius: 1.25, height: 1.05, position: [0, 0.32, 0], material: materials.surface });
  kit.drum({ radius: 0.72, height: 0.62, position: [0, 1.37, 0], material: materials.dark });
  kit.rotor({ radius: 0.68, position: [0, 2.15, 0], speed: 0.2 });
  kit.torus({ radius: 2.12, tube: 0.045, position: [0, 0.42, 0], rotation: [Math.PI / 2, 0, 0], material: materials.cyan });

  const spokeCount = random() > 0.5 ? 6 : 5;
  for (let index = 0; index < spokeCount; index += 1) {
    const angle = (index / spokeCount) * Math.PI * 2;
    const x = Math.cos(angle) * 1.82;
    const z = Math.sin(angle) * 1.82;
    kit.box({
      size: [1.85, 0.2, 0.42],
      position: [x * 0.52, 0.62, z * 0.52],
      rotation: [0, -angle, 0],
      material: materials.black,
    });
    if (index % 2 === 0) {
      kit.speaker({ radius: 0.36, position: [x, 0.92, z], rotation: [0, -angle + Math.PI / 2, 0] });
    } else {
      kit.chassis({ width: 0.72, height: 0.72, depth: 0.72, position: [x, 0.4, z], rotation: [0, -angle, 0], material: materials.mid });
      kit.sphere({ radius: 0.09, position: [x, 1.2, z], material: index === 1 ? materials.lime : materials.cyan });
    }
  }
  kit.antenna({ height: 1.5, position: [2.1, 0.34, -1.2], material: materials.lime });
}

function tapeShrine(kit, random) {
  const { materials } = kit;
  kit.chassis({ width: 5.3, height: 0.34, depth: 3.4, material: materials.dark });
  kit.chassis({ width: 3.2, height: 0.65, depth: 1.1, position: [0, 0.34, -1.15], material: materials.mid });
  kit.reelDeck({ width: 3.05, height: 2.05, position: [0, 1.0, -1.05] });
  kit.keybed({ width: 3.3, depth: 1.12, keys: 11, position: [0, 0.42, 0.82] });
  kit.patchBay({ width: 1.1, height: 1.45, columns: 3, rows: 4, position: [-2.08, 0.44, -0.95] });
  kit.patchBay({ width: 1.1, height: 1.45, columns: 3, rows: 4, position: [2.08, 0.44, -0.95] });
  kit.bridge({ length: 5.0, position: [0, 2.98, -1.0], nodes: 5 });
  kit.conduit({
    points: [[-1.95, 1.5, -0.75], [-1.72, 2.45, -0.45], [-0.9, 2.72, 0.1], [-0.8, 0.72, 0.65]],
    material: materials.cyan,
  });
  kit.conduit({
    points: [[1.95, 1.25, -0.8], [2.35, 2.1, -0.25], [1.5, 2.55, 0.2], [1.1, 0.72, 0.7]],
    material: materials.lime,
    radius: between(random, 0.045, 0.07),
  });
}

function walkingSequencer(kit, random) {
  const { materials } = kit;
  const bodyLength = 5.8;
  kit.chassis({ width: bodyLength, height: 0.72, depth: 1.75, position: [0, 0.82, 0], material: materials.mid });
  for (const [index, x] of [-2.25, -0.8, 0.8, 2.25].entries()) {
    const height = between(random, 0.72, 1.0);
    kit.box({
      size: [0.28, height, 0.32],
      position: [x, height / 2, index % 2 === 0 ? -0.62 : 0.62],
      rotation: [0, 0, x * 0.035],
      material: materials.dark,
    });
  }
  kit.padBank({ columns: 10, rows: 1, cell: 0.42, position: [-0.25, 1.62, 0] });
  kit.bridge({ length: 5.45, position: [0, 2.02, -0.42], rotation: [0, 0.035, 0], nodes: 6 });
  kit.chassis({ width: 1.3, height: 1.05, depth: 1.2, position: [1.85, 1.56, 0.1], material: materials.dark });
  kit.speaker({ radius: 0.56, position: [1.85, 2.62, 0.72] });
  kit.speaker({ radius: 0.52, position: [-3.05, 1.6, 0], rotation: [0, -Math.PI / 2, 0] });
  kit.antenna({ height: 1.45, position: [2.5, 1.55, -0.42], material: materials.lime });
  kit.conduit({
    points: [[-2.7, 1.55, 0.52], [-1.45, 2.55, 0.75], [0.65, 2.62, 0.55], [2.35, 2.15, 0.32]],
    material: materials.cyan,
  });
}

const BUILDERS = {
  'signal-console': signalConsole,
  'relay-tower': relayTower,
  'twin-deck': twinDeck,
  'radial-engine': radialEngine,
  'tape-shrine': tapeShrine,
  'walking-sequencer': walkingSequencer,
};

export function buildMachine(seed) {
  const random = seededRandom(seed);
  const family = familyForSeed(seed);
  const kit = createMachineKit(random);
  BUILDERS[family.id](kit, random);
  return { ...kit.finish(between(random, 0, Math.PI * 2)), family };
}
