'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { Project } from '../data/content-types';
import { trackEvent } from '../lib/analytics';
import { labelCode } from '../lib/labels';
import { titleFitStyle } from '../lib/titleFit';
import AmbientField from './AmbientField';

/** Projects page: the latest release gets the stage, the back catalogue sits below as a record wall. */
export default function ProjectIndex({ projects }: { projects: Project[] }) {
  const releaseRefs = useRef<Array<HTMLElement | null>>([]);
  const [scrolledIndex, setScrolledIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const latest = projects[0];
  const activeIndex = hoveredIndex ?? scrolledIndex;

  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      const focusLine = window.innerHeight * 0.5;
      let nextIndex = 0;
      let distance = Number.POSITIVE_INFINITY;
      releaseRefs.current.forEach((release, index) => {
        if (!release) return;
        const bounds = release.getBoundingClientRect();
        const candidate = Math.abs(bounds.top + bounds.height / 2 - focusLine);
        if (candidate >= distance) return;
        distance = candidate;
        nextIndex = index;
      });
      setScrolledIndex(nextIndex);
    }
    function scheduleUpdate() {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    }
    scheduleUpdate();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);

  function hoverHandlers(index: number) {
    return {
      onPointerEnter: () => setHoveredIndex(index),
      onPointerLeave: () => setHoveredIndex(null),
      onFocus: () => setHoveredIndex(index),
      onBlur: () => setHoveredIndex(null),
    };
  }

  return (
    <main className="shell-main index-main">
      <AmbientField ambience={projects[activeIndex].ambience} activeIndex={activeIndex} />

      <section
        className="index-hero"
        aria-labelledby="latest-release-title"
        ref={(node) => { releaseRefs.current[0] = node; }}
      >
        <Link
          className="index-hero-link"
          href={`/projects/${latest.slug}`}
          onClick={() => trackEvent({ name: 'project_open', project: latest.slug, source: 'index' })}
          {...hoverHandlers(0)}
        >
          <div className="index-hero-art" style={{ background: latest.placeholder }}>
            <Image
              src={latest.coverUrl}
              width={1200}
              height={1200}
              sizes="(min-width: 900px) 56vw, 100vw"
              priority
              alt={latest.coverAlt}
            />
          </div>
          <div className="index-hero-copy">
            <div className="index-kicker">
              <span>latest release</span>
              <span>{labelCode(latest.catalog)}</span>
            </div>
            <h1 id="latest-release-title" style={titleFitStyle(latest.title)}>{latest.title}</h1>
            <p>{latest.summary}</p>
            <dl className="index-hero-facts">
              <div><dt>year</dt><dd>{latest.year}</dd></div>
              <div><dt>format</dt><dd>{latest.format}</dd></div>
              <div><dt>status</dt><dd>{latest.status}</dd></div>
            </dl>
            <span className="index-cta">open release <span aria-hidden="true">↗</span></span>
          </div>
        </Link>
      </section>

      <section className="index-catalogue" aria-labelledby="back-catalogue-title">
        <div className="index-rule">
          <h2 id="back-catalogue-title">back catalogue</h2>
          <span>{projects.length - 1} releases</span>
        </div>
        <ol className="record-wall">
          {projects.slice(1).map((project, offset) => {
            const index = offset + 1;
            return (
              <li key={project.slug} ref={(node) => { releaseRefs.current[index] = node; }}>
                <Link
                  className="record-tile"
                  href={`/projects/${project.slug}`}
                  onClick={() => trackEvent({ name: 'project_open', project: project.slug, source: 'index' })}
                  {...hoverHandlers(index)}
                >
                  <span className="record-tile-art" style={{ background: project.placeholder }}>
                    <Image src={project.coverUrl} width={600} height={600} sizes="(min-width: 1100px) 280px, (min-width: 700px) 30vw, 46vw" alt="" />
                  </span>
                  <span className="record-tile-meta">
                    <span>{labelCode(project.catalog)}</span>
                    <span>{project.year}</span>
                  </span>
                  <span className="record-tile-title">{project.title}</span>
                  <span className="record-tile-summary">{project.summary}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
