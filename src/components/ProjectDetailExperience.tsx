import type { CSSProperties } from 'react';

import { MDXRemote } from 'next-mdx-remote/rsc';
import Image from 'next/image';
import Link from 'next/link';
import type { Project } from '../data/content-types';
import { crateHref } from '../lib/crate';
import { optimizedImageUrl } from '../lib/imageUrl';
import { labelCode } from '../lib/labels';
import { titleFitStyle } from '../lib/titleFit';
import CoverFlip from './CoverFlip';

interface ProjectDetailExperienceProps {
  project: Project;
  projectIndex: number;
  projectCount: number;
  newer?: Project;
  older?: Project;
}

type DetailStyle = CSSProperties & { '--detail-art': string };

export default async function ProjectDetailExperience({ project, projectIndex, projectCount, newer, older }: ProjectDetailExperienceProps) {
  const label = labelCode(projectCount, projectIndex);

  return (
    <main
      className="shell-main detail-main immersive-detail"
      style={{ '--detail-art': `url("${optimizedImageUrl(project.coverUrl, 384)}")` } as DetailStyle}
    >
      <div className="detail-art-backdrop" style={{ background: project.placeholder }} aria-hidden="true" />
      <div className="detail-art-scrim" aria-hidden="true" />

      <article className="project-detail">
        <nav className="detail-bar" aria-label="Project">
          <Link href={crateHref(projectIndex, project.slug)}><span aria-hidden="true">←</span> back</Link>
          <span className="detail-label">{label}</span>
        </nav>

        <div className="detail-hero">
          <div className="detail-covers">
            <CoverFlip
              front={{ src: project.coverUrl, alt: project.coverAlt }}
              back={project.backCoverUrl ? { src: project.backCoverUrl, alt: project.backCoverAlt ?? `${project.title} back cover` } : undefined}
              title={project.title}
              placeholder={project.placeholder}
            />
          </div>

          <header className="detail-header">
            <h1 style={titleFitStyle(project.title)}>{project.title}</h1>
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
            ].map(({ neighbour, label: direction, offset }) => neighbour && (
              <Link key={direction} className={`neighbour neighbour-${direction}`} href={`/projects/${neighbour.slug}`}>
                <span className="neighbour-art" style={{ background: neighbour.placeholder }}>
                  <Image src={neighbour.coverUrl} width={240} height={240} sizes="72px" alt="" />
                </span>
                <span className="neighbour-copy">
                  <span className="neighbour-meta">{labelCode(projectCount, projectIndex + offset)}</span>
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
