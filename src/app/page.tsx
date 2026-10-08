import CrateScrollExperience from '../components/CrateScrollExperience';
import SiteShell from '../components/SiteShell';
import { getProjects } from '../lib/content';
import { pageMetadata } from '../lib/metadata';

export const metadata = pageMetadata({ path: '/' });

export default function HomePage() {
  const projects = getProjects();
  return (
    <SiteShell className="crate-page">
      <CrateScrollExperience projects={projects} />
    </SiteShell>
  );
}
