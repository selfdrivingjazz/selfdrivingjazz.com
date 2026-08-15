const TOPOLOGIES = [
  { id: 'constellation', name: 'Constellation' },
  { id: 'fold', name: 'Folded Instrument' },
  { id: 'rack', name: 'Vertical Rack' },
  { id: 'procession', name: 'Procession' },
  { id: 'courtyard', name: 'Courtyard' },
  { id: 'bridge', name: 'Suspended Bridge' },
  { id: 'islands', name: 'Signal Islands' },
  { id: 'orbital', name: 'Orbital Array' },
  { id: 'crawler', name: 'Crawler' },
  { id: 'monolith', name: 'Monolith' },
];

const PALETTES = [
  { id: 'mint-terminal', black: 0x050807, dark: 0x0c1512, mid: 0x20332d, surface: 0x49665c, hardware: 0x9bad9f, primary: 0x7ff3d1, secondary: 0xd4ef69, white: 0xf3f5e9 },
  { id: 'ultraviolet-lab', black: 0x09070e, dark: 0x171122, mid: 0x33294a, surface: 0x5b5072, hardware: 0xb7adc7, primary: 0x9b8cff, secondary: 0xffdf63, white: 0xf5f0ff },
  { id: 'oxide-radio', black: 0x0b0907, dark: 0x211710, mid: 0x543725, surface: 0x8a684f, hardware: 0xc8b59b, primary: 0xff8b5c, secondary: 0xaeea72, white: 0xfff1dc },
  { id: 'blueprint', black: 0x05090f, dark: 0x0d1a2a, mid: 0x1c3c5a, surface: 0x376d89, hardware: 0xa2bbca, primary: 0x65d7ff, secondary: 0xff9ec7, white: 0xedf8ff },
  { id: 'bone-signal', black: 0x0a0a09, dark: 0x1a1b18, mid: 0x3c4038, surface: 0x73786b, hardware: 0xbfc2b3, primary: 0xf5f0d4, secondary: 0xff5f46, white: 0xfffff4 },
  { id: 'toy-research', black: 0x08090a, dark: 0x151a20, mid: 0x304156, surface: 0x5c7691, hardware: 0xb2c2cf, primary: 0x5ee6ff, secondary: 0xffd447, white: 0xf4fbff },
];

const ROLES = ['sequencer', 'mixer', 'patch', 'reel', 'speaker', 'scanner', 'keys', 'logic'];
const ADJECTIVES = ['Tender', 'Oblique', 'Ferrous', 'Nocturnal', 'Pocket', 'Errant', 'Elastic', 'Minor', 'Soft', 'Unlicensed'];
const NOUNS = ['Transceiver', 'Choir Engine', 'Weather Organ', 'Handshake', 'Relay Animal', 'Time Printer', 'Listening Device', 'Protocol Toy', 'Memory Press', 'Drift Computer'];

export function createSeededRandom(seed) {
  let value = seed >>> 0;
  const random = () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
  random.between = (minimum, maximum) => minimum + (maximum - minimum) * random();
  random.integer = (minimum, maximum) => Math.floor(random.between(minimum, maximum + 1));
  random.pick = (values) => values[Math.min(values.length - 1, Math.floor(random() * values.length))];
  return random;
}

function anchorsForTopology(topology, random) {
  if (topology.id === 'constellation') {
    const count = random.integer(4, 7);
    return [
      { x: 0, y: 0, z: 0, scale: 1.15, form: 'drum' },
      ...Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2 + random.between(-0.16, 0.16);
        const radius = random.between(2.05, 2.75);
        return { x: Math.cos(angle) * radius, y: 0, z: Math.sin(angle) * radius, scale: random.between(0.62, 0.9), rotation: -angle + Math.PI / 2 };
      }),
    ];
  }
  if (topology.id === 'fold') {
    const spread = random.between(1.35, 1.85);
    return [
      { x: 0, y: 0, z: -0.35, scale: 1.05 },
      { x: -spread, y: 0.1, z: 0.25, scale: 1.1, rotation: random.between(-0.42, -0.22) },
      { x: spread, y: 0.1, z: 0.25, scale: 1.1, rotation: random.between(0.22, 0.42) },
      { x: 0, y: random.between(0.75, 1.15), z: -1.05, scale: 0.72, form: 'drum' },
    ];
  }
  if (topology.id === 'rack') {
    const levels = random.integer(3, 5);
    return [
      ...Array.from({ length: levels }, (_, index) => ({ x: random.between(-0.12, 0.12), y: index * random.between(0.72, 0.88), z: 0, scale: 1 - index * 0.06 })),
      { x: -1.45, y: 0.25, z: 0.15, scale: 0.62, rotation: -0.2 },
      { x: 1.45, y: 0.75, z: -0.1, scale: 0.62, rotation: 0.2, form: 'drum' },
    ];
  }
  if (topology.id === 'procession') {
    const count = random.integer(4, 7);
    return Array.from({ length: count }, (_, index) => ({
      x: (index - (count - 1) / 2) * random.between(1.05, 1.35),
      y: index % 3 === 1 ? random.between(0.3, 0.75) : 0,
      z: (index % 2 ? 1 : -1) * random.between(0.35, 0.85),
      scale: random.between(0.65, 1.02),
      rotation: random.between(-0.18, 0.18),
      form: index % 3 === 2 ? 'drum' : 'box',
    }));
  }
  if (topology.id === 'courtyard') {
    const width = random.between(1.65, 2.15);
    const depth = random.between(1.3, 1.8);
    return [
      { x: -width, y: 0, z: 0, scale: 0.9, rotation: -0.18 },
      { x: -width * 0.72, y: 0.25, z: -depth, scale: 0.75 },
      { x: 0, y: 0, z: -depth * 1.25, scale: 1.0 },
      { x: width * 0.72, y: 0.25, z: -depth, scale: 0.75 },
      { x: width, y: 0, z: 0, scale: 0.9, rotation: 0.18 },
    ];
  }
  if (topology.id === 'bridge') {
    const width = random.between(1.9, 2.5);
    const height = random.between(1.25, 1.75);
    return [
      { x: -width, y: 0, z: 0, scale: 1.0 },
      { x: width, y: 0, z: 0, scale: 1.0 },
      { x: 0, y: height, z: 0, scale: 0.82, form: 'drum' },
      { x: -width * 0.5, y: height * 0.45, z: 0.7, scale: 0.52 },
      { x: width * 0.5, y: height * 0.45, z: -0.7, scale: 0.52 },
    ];
  }
  if (topology.id === 'islands') {
    const count = random.integer(3, 5);
    const anchors = [];
    let attempts = 0;
    while (anchors.length < count && attempts < 80) {
      attempts += 1;
      const candidate = { x: random.between(-2.8, 2.8), y: random.between(0, 0.25), z: random.between(-2.1, 2.1), scale: random.between(0.8, 1.25), rotation: random.between(-0.5, 0.5) };
      if (anchors.every((anchor) => Math.hypot(anchor.x - candidate.x, anchor.z - candidate.z) > 1.65)) anchors.push(candidate);
    }
    return anchors;
  }
  if (topology.id === 'orbital') {
    const count = random.integer(5, 8);
    return Array.from({ length: count }, (_, index) => {
      const angle = (index / count) * Math.PI * 2;
      const radius = random.between(1.85, 2.45);
      return { x: Math.cos(angle) * radius, y: index % 2 ? 0.25 : 0, z: Math.sin(angle) * radius, scale: random.between(0.55, 0.8), rotation: -angle + Math.PI / 2, form: 'drum' };
    });
  }
  if (topology.id === 'crawler') {
    const count = random.integer(4, 6);
    return Array.from({ length: count }, (_, index) => ({
      x: (index - (count - 1) / 2) * 1.15,
      y: random.between(0.45, 0.85),
      z: random.between(-0.18, 0.18),
      scale: random.between(0.72, 1),
      rotation: random.between(-0.08, 0.08),
      legs: true,
    }));
  }
  const levels = random.integer(3, 5);
  return [
    ...Array.from({ length: levels }, (_, index) => ({ x: 0, y: index * 0.9, z: 0, scale: Math.max(0.54, 1.15 - index * 0.13), rotation: index % 2 ? Math.PI / 2 : 0 })),
    { x: random.between(-1.5, -1.1), y: random.between(0.3, 0.8), z: 0.3, scale: 0.55, form: 'drum' },
  ];
}

function connectedEdges(topology, moduleCount) {
  const edges = [];
  if (topology.id === 'constellation') {
    for (let index = 1; index < moduleCount; index += 1) edges.push([0, index]);
    return edges;
  }
  if (topology.id === 'orbital') {
    for (let index = 0; index < moduleCount; index += 1) edges.push([index, (index + 1) % moduleCount]);
    return edges;
  }
  for (let index = 0; index < moduleCount - 1; index += 1) edges.push([index, index + 1]);
  if (topology.id === 'courtyard' || topology.id === 'bridge') edges.push([0, moduleCount - 1]);
  return edges;
}

function makeModules(anchors, random) {
  const roles = [...ROLES].sort(() => random() - 0.5);
  return anchors.map((anchor, index) => {
    const form = anchor.form ?? (random() < 0.24 ? 'drum' : 'box');
    const scale = anchor.scale ?? 1;
    const width = random.between(1.1, 1.85) * scale;
    const depth = random.between(0.9, 1.55) * scale;
    return {
      id: `module-${index}`,
      form,
      role: roles[index % roles.length],
      position: [anchor.x, anchor.y, anchor.z],
      rotation: anchor.rotation ?? 0,
      size: [width, random.between(0.38, 0.82) * Math.max(0.8, scale), depth],
      accent: index % 3 === 0 ? 'secondary' : 'primary',
      legs: anchor.legs ?? false,
      plinth: random() > 0.22,
    };
  });
}

function worldPort(module, side) {
  const [width, height, depth] = module.size;
  const localX = side === 'left' ? -width * 0.52 : 0;
  const localZ = side === 'front' ? depth * 0.52 : 0;
  const cosine = Math.cos(module.rotation);
  const sine = Math.sin(module.rotation);
  return [
    module.position[0] + localX * cosine + localZ * sine,
    module.position[1] + height + 0.12,
    module.position[2] - localX * sine + localZ * cosine,
  ];
}

export function generateMachinePlan(seed) {
  const random = createSeededRandom(seed);
  const topology = TOPOLOGIES[(seed >>> 0) % TOPOLOGIES.length];
  const palette = PALETTES[Math.floor(random() * PALETTES.length)];
  const modules = makeModules(anchorsForTopology(topology, random), random);
  const edges = connectedEdges(topology, modules.length);
  const cableBudget = Math.min(edges.length, random.integer(1, 3));
  const selectedEdges = [...edges].sort(() => random() - 0.5).slice(0, cableBudget);
  const cables = selectedEdges.map(([fromIndex, toIndex], index) => ({
    from: worldPort(modules[fromIndex], index % 2 ? 'left' : 'front'),
    to: worldPort(modules[toIndex], index % 2 ? 'front' : 'left'),
    lift: random.between(0.32, 0.7),
    radius: random.between(0.025, 0.045),
    material: index % 2 ? 'secondary' : 'primary',
  }));
  const nameRandom = createSeededRandom((seed ^ 0xa5a5a5a5) >>> 0);
  return {
    seed: seed >>> 0,
    topology,
    palette,
    modules,
    edges,
    cables,
    specimen: `${nameRandom.pick(ADJECTIVES)} ${nameRandom.pick(NOUNS)}`,
    phase: random.between(0, Math.PI * 2),
  };
}

export { TOPOLOGIES };
