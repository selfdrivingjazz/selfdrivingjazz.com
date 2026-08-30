import Link from 'next/link';
import type { Project } from '../data/content-types';

export default function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <ol className="project-list">
      {projects.map((project, index) => (
        <li key={project.slug}>
          <Link href={`/projects/${project.slug}`}>
            <span className="project-number">{String(projects.length - index).padStart(3, '0')}</span>
            <span className="project-title">{project.title}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
