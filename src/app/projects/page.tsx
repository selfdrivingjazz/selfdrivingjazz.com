import HomeExperience from '../../components/HomeExperience';
import SiteShell from '../../components/SiteShell';
import { pageMetadata } from '../../lib/metadata';

export const metadata = pageMetadata({
  path: '/projects',
  description: 'Projects and experiments in recursive media from self-driving jazz.',
});

export default function ProjectsPage() {
  return (
    <SiteShell className="projects-page">
      <HomeExperience scrollAmbience />
    </SiteShell>
  );
}
