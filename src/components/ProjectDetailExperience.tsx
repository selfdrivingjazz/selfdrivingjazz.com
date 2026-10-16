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
  newer?: Project;
  older?: Project;
}

type DetailStyle = CSSProperties & { '--detail-art': string };

export default async function ProjectDetailExperience({ project, projectIndex, newer, older }: ProjectDetailExperienceProps) {
  const label = labelCode(project.catalog);

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
          {/* Vault prose is plain markdown, not MDX: braces and angle brackets stay literal. */}
          <MDXRemote
            source={project.content ?? ''}
            options={{ mdxOptions: { format: 'md' } }}
            components={{
              // Plain <img>: sync-vault already wrote optimised WebP into public/project-media.
              img: (props) => <img {...props} alt={props.alt ?? ''} loading="lazy" decoding="async" />,
            }}
          />
        </div>

        {(newer || older) && (
          <nav className="detail-neighbours" aria-label="More releases">
            {[
              { neighbour: newer, direction: 'newer' },
              { neighbour: older, direction: 'older' },
            ].map(({ neighbour, direction }) => neighbour && (
              <Link key={direction} className={`neighbour neighbour-${direction}`} href={`/projects/${neighbour.slug}`}>
                <span className="neighbour-art" style={{ background: neighbour.placeholder }}>
                  <Image src={neighbour.coverUrl} width={240} height={240} sizes="72px" alt="" />
                </span>
                <span className="neighbour-copy">
                  <span className="neighbour-meta">{labelCode(neighbour.catalog)}</span>
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
