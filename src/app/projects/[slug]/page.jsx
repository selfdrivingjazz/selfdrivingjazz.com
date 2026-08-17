import { notFound } from 'next/navigation';
import ProjectDetailExperience from '../../../components/ProjectDetailExperience.jsx';
import JsonLd from '../../../components/JsonLd.jsx';
import SiteShell from '../../../components/SiteShell.jsx';
import { getProject } from '../../../data/projects.js';
import { SITE_NAME, SITE_URL, pageMetadata } from '../../../lib/metadata.js';


export async function generateMetadata({ params }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return pageMetadata({ path: '/projects' });
  return pageMetadata({
    path: `/projects/${project.slug}`,
    description: project.summary,
    projectSlug: project.slug,
    socialTitle: `${project.title} — ${SITE_NAME}`,
    imageAlt: project.coverAlt,
  });
}

export default async function ProjectDetailPage({ params }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const projectUrl = `${SITE_URL}/projects/${project.slug}`;
  const imageUrl = project.coverUrl.startsWith('http')
    ? project.coverUrl
    : `${SITE_URL}${project.coverUrl}`;
  const projectData = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${projectUrl}#project`,
    name: project.title,
    description: project.summary,
    url: projectUrl,
    image: imageUrl,
    dateCreated: project.year,
    creator: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    contributor: project.collaborators,
    inLanguage: 'en-US',
  };

  return (
    <SiteShell className="detail-page">
      <JsonLd data={projectData} />
      <ProjectDetailExperience project={project} />
    </SiteShell>
  );
}
