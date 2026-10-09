import CrateScrollExperience from '../components/CrateScrollExperience';
import SiteShell from '../components/SiteShell';
import { getOlderWorksSleeve, getProjects } from '../lib/content';
import { pageMetadata } from '../lib/metadata';

export const metadata = pageMetadata({ path: '/' });

export default async function HomePage() {
  const [projects, olderWorks] = await Promise.all([getProjects(), getOlderWorksSleeve()]);
  return (
    <SiteShell className="crate-page">
      <CrateScrollExperience projects={projects} olderWorks={olderWorks} />
    </SiteShell>
  );
}
