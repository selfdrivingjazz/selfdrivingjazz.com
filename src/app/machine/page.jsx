import { randomBytes } from 'node:crypto';
import Link from 'next/link';
import MachineExperience from '../../components/MachineExperience.jsx';
import SiteShell from '../../components/SiteShell.jsx';
import { pageMetadata } from '../../lib/metadata.js';

export const dynamic = 'force-dynamic';

export const metadata = pageMetadata({
  path: '/machine',
  description: 'An evolving procedural machine from self-driving jazz.',
});

function resolveSeed(value) {
  const parameter = Array.isArray(value) ? value[0] : value;
  const requestedSeed = Number(parameter);
  if (parameter !== undefined && Number.isInteger(requestedSeed) && requestedSeed >= 0) {
    return requestedSeed >>> 0;
  }
  return randomBytes(4).readUInt32LE(0);
}

export default async function MachinePage({ searchParams }) {
  const parameters = await searchParams;
  const seed = resolveSeed(parameters?.seed);

  return (
    <SiteShell className="machine-page">
      <main className="shell-main machine-main">
        <div className="page-intro section-heading">
          <h1>generative machine</h1>
          <Link href="/">back</Link>
        </div>
        <div className="machine-surface" aria-label="Evolving procedural machine">
          <MachineExperience seed={seed} />
        </div>
      </main>
    </SiteShell>
  );
}
