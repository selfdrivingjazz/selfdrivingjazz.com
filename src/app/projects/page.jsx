import Link from 'next/link';
import ProjectList from '../../components/ProjectList.jsx';
import SiteShell from '../../components/SiteShell.jsx';
import { pageMetadata } from '../../lib/metadata.js';

export const metadata = pageMetadata({
  path: '/projects',
  description: 'Projects and experiments in recursive media from self-driving jazz.',
});

export default function ProjectsPage() {
  return (
    <SiteShell className="projects-page">
      <main className="shell-main projects-main">
        <div className="page-intro section-heading page-heading">
          <h1>all projects</h1>
          <Link href="/">back</Link>
        </div>
        <ProjectList />
      </main>
    </SiteShell>
  );
}
