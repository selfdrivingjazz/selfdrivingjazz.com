import HomeExperience from '../components/HomeExperience';
import SiteShell from '../components/SiteShell';
import { getProjects } from '../lib/content';
import { pageMetadata } from '../lib/metadata';

export const metadata = pageMetadata({ path: '/' });

export default function HomePage() {
  const projects = getProjects();
  return (
    <SiteShell className="home-page">
      <HomeExperience projects={projects} />
    </SiteShell>
  );
}
