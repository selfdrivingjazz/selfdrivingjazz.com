'use client';

import MachineCanvas from '../MachineCanvas';

export default function MachineExperience({ seed }: { seed: number }) {
  return <MachineCanvas seed={seed} evolution />;
}
