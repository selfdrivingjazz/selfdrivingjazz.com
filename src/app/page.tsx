import CrateScrollExperience from '../components/CrateScrollExperience';
import SiteShell from '../components/SiteShell';
import { getProjects } from '../lib/content';
import { pageMetadata } from '../lib/metadata';

export const metadata = pageMetadata({ path: '/' });

export default async function HomePage() {
  const projects = await getProjects();
  return (
    <SiteShell className="crate-page">
      <CrateScrollExperience projects={projects} />
    </SiteShell>
  );
}
