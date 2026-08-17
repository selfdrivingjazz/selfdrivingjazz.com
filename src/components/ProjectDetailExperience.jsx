import Image from 'next/image';
import Link from 'next/link';

export default function ProjectDetailExperience({ project }) {
  const closeDestination = `/?return=${encodeURIComponent(project.slug)}`;

  return (
    <main
      className="shell-main detail-main immersive-detail"
      style={{ '--detail-art': `url("${project.coverUrl}")` }}
    >
      <div className="detail-art-backdrop" aria-hidden="true" />
      <div className="detail-art-scrim" aria-hidden="true" />

      <article className="project-detail">
        <div className="detail-kicker">
          <span>{project.label}</span>
          <div className="detail-actions">
            <Link href="/projects">all projects</Link>
            <Link href={closeDestination}>
              close <span aria-hidden="true">×</span>
            </Link>
          </div>
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
            <figcaption>
              {project.creditLabel ?? 'Photo'}:{' '}
              <a href={project.creditUrl} target="_blank" rel="noreferrer">{project.creditName}</a>
              {project.creditSuffix ?? ' / Unsplash'}
            </figcaption>
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
  );
}
