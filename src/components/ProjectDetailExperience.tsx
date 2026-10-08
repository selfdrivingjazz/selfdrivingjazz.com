import type { CSSProperties } from 'react';

import { MDXRemote } from 'next-mdx-remote/rsc';
import Image from 'next/image';
import Link from 'next/link';
import type { Project } from '../data/content-types';
import { labelCode } from '../lib/labels';

interface ProjectDetailExperienceProps {
  project: Project;
  projectIndex: number;
  projectCount: number;
  newer?: Project;
  older?: Project;
}

type DetailStyle = CSSProperties & { '--detail-art': string };

export default async function ProjectDetailExperience({ project, projectIndex, projectCount, newer, older }: ProjectDetailExperienceProps) {
  const covers = [
    { src: project.coverUrl, alt: project.coverAlt },
    ...(project.backCoverUrl ? [{ src: project.backCoverUrl, alt: project.backCoverAlt ?? `${project.title} back cover` }] : []),
  ];

  return (
    <main
      className="shell-main detail-main immersive-detail"
      style={{ '--detail-art': `url("${project.coverUrl}")` } as DetailStyle}
    >
      <div className="detail-art-backdrop" aria-hidden="true" />
      <div className="detail-art-scrim" aria-hidden="true" />

      <article className="project-detail">
        <nav className="detail-bar" aria-label="Project">
          <Link href={`/#${project.slug}`}><span aria-hidden="true">←</span> crate</Link>
          <span className="detail-label">
            {labelCode(projectCount, projectIndex)}
            <span> / {String(projectCount).padStart(3, '0')}</span>
          </span>
        </nav>

        <div className="detail-hero">
          <div className={`detail-covers${covers.length > 1 ? ' is-pair' : ''}`} aria-label={`${project.title} cover art`}>
            {covers.map((cover, index) => (
              <figure className="project-cover" key={cover.src}>
                <Image
                  src={cover.src}
                  width={1600}
                  height={1600}
                  sizes={covers.length > 1 ? '(min-width: 900px) 340px, 86vw' : '(min-width: 900px) 600px, 100vw'}
                  alt={cover.alt}
                  priority={index === 0}
                />
              </figure>
            ))}
          </div>

          <header className="detail-header">
            <p className="detail-format">{project.format}</p>
            <h1>{project.title}</h1>
            <p className="detail-summary">{project.summary}</p>
            <dl className="project-facts">
              <div><dt>year</dt><dd>{project.year}</dd></div>
              <div><dt>status</dt><dd>{project.status}</dd></div>
              <div><dt>with</dt><dd>{project.collaborators}</dd></div>
            </dl>
            {project.outboundUrl && (
              <a className="outbound-link" href={project.outboundUrl} target="_blank" rel="noreferrer">
                visit project <span aria-hidden="true">↗</span>
              </a>
            )}
          </header>
        </div>

        <div className="project-writeup">
          <MDXRemote source={project.content ?? ''} />
        </div>

        {(newer || older) && (
          <nav className="detail-neighbours" aria-label="More releases">
            {[
              { neighbour: newer, label: 'newer', offset: -1 },
              { neighbour: older, label: 'older', offset: 1 },
            ].map(({ neighbour, label, offset }) => neighbour && (
              <Link key={label} className={`neighbour neighbour-${label}`} href={`/projects/${neighbour.slug}`}>
                <span className="neighbour-art">
                  <Image src={neighbour.coverUrl} width={240} height={240} sizes="72px" alt="" />
                </span>
                <span className="neighbour-copy">
                  <span className="neighbour-meta">{label} · {labelCode(projectCount, projectIndex + offset)}</span>
                  <span className="neighbour-title">{neighbour.title}</span>
                </span>
              </Link>
            ))}
          </nav>
        )}
      </article>
    </main>
  );
}
