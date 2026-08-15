export const MACHINE_FAMILIES = [
  { id: 'signal-console', name: 'Signal Console' },
  { id: 'relay-tower', name: 'Relay Tower' },
  { id: 'twin-deck', name: 'Twin Deck' },
  { id: 'radial-engine', name: 'Radial Engine' },
  { id: 'tape-shrine', name: 'Tape Shrine' },
  { id: 'walking-sequencer', name: 'Walking Sequencer' },
];

export function familyForSeed(seed) {
  return MACHINE_FAMILIES[(seed >>> 0) % MACHINE_FAMILIES.length];
}

export function specimenCode(seed) {
  return (seed >>> 0).toString(16).padStart(8, '0').slice(-8).toUpperCase();
}

export function nextMachineSeed(seed) {
  let value = seed >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  value >>>= 0;

  const nextFamily = ((seed >>> 0) % MACHINE_FAMILIES.length + 1) % MACHINE_FAMILIES.length;
  while (value % MACHINE_FAMILIES.length !== nextFamily) value = (value + 1) >>> 0;
  return value;
}
