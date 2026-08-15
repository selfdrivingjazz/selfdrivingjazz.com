import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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
      <main className="shell-main detail-main">
        <article className="project-detail">
          <div className="detail-kicker">
            <span>{project.label}</span>
            <Link href="/projects">all projects</Link>
          </div>

          <div className="detail-hero">
            <header className="detail-header">
              <h1>{project.title}</h1>
              <p>{project.summary}</p>
              {project.outboundUrl && (
                <a className="outbound-link" href={project.outboundUrl} target="_blank" rel="noreferrer">
                  visit project <span aria-hidden="true">↗</span>
                </a>
              )}
            </header>

            <figure className="project-cover">
              <Image
                src={project.coverUrl}
                width={1600}
                height={1600}
                sizes="(min-width: 900px) 620px, (min-width: 761px) 680px, calc(100vw - 36px)"
                alt={project.coverAlt}
                priority
              />
              <figcaption>{project.creditLabel ?? 'Photo'}: <a href={project.creditUrl} target="_blank" rel="noreferrer">{project.creditName}</a>{project.creditSuffix ?? ' / Unsplash'}</figcaption>
            </figure>
          </div>

          <a className="detail-scroll" href="#project-details">
            <span>project details</span>
            <span aria-hidden="true">↓</span>
          </a>

          <div className="project-body" id="project-details">
            <dl className="project-meta">
              <div><dt>year</dt><dd>{project.year}</dd></div>
              <div><dt>status</dt><dd>{project.status}</dd></div>
              <div><dt>format</dt><dd>{project.format}</dd></div>
              <div><dt>with</dt><dd>{project.collaborators}</dd></div>
            </dl>
            <div className="project-writeup">
              {project.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>
        </article>
      </main>
    </SiteShell>
  );
}
