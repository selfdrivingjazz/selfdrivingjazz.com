import ProjectIndex from '../../components/ProjectIndex';
import SiteShell from '../../components/SiteShell';
import { getProjects } from '../../lib/content';
import { pageMetadata } from '../../lib/metadata';

export const metadata = pageMetadata({
  path: '/projects',
  description: 'Projects and experiments in recursive media from self-driving jazz.',
});

export default function ProjectsPage() {
  const projects = getProjects();
  return (
    <SiteShell className="projects-page">
      <ProjectIndex projects={projects} />
    </SiteShell>
  );
}
