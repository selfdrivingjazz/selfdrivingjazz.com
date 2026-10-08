'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import RecordCrate from '../RecordCrate';
import type { Project } from '../data/content-types';
import { labelCode } from '../lib/labels';
import AmbientField, { DEFAULT_AMBIENCE } from './AmbientField';

/** Opt in with `?pull=1`, opt out with `?pull=0`; the choice persists per browser. */
const PULL_TRANSITION_KEY = 'sdj:pull-transition';

function readPullTransitionPreference(): boolean {
  const requested = new URLSearchParams(window.location.search).get('pull');
  if (requested === '1') window.localStorage.setItem(PULL_TRANSITION_KEY, '1');
  if (requested === '0') window.localStorage.removeItem(PULL_TRANSITION_KEY);
  return window.localStorage.getItem(PULL_TRANSITION_KEY) === '1';
}

export default function CrateScrollExperience({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const frameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pullTransition, setPullTransition] = useState(false);
  const ambience = projects[activeIndex].ambience ?? DEFAULT_AMBIENCE;

  useEffect(() => {
    setPullTransition(readPullTransitionPreference());
    const root = document.documentElement;
    root.classList.add('crate-scroll-active');
    const hashTarget = window.location.hash && document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (hashTarget) hashTarget.scrollIntoView({ behavior: 'instant' });
    // Any internal link (header menu included) must leave without smooth scrolling, or Next's scroll-to-top stalls midway.
    function releaseSmoothScroll(event: MouseEvent) {
      if (event.target instanceof Element && event.target.closest('a[href^="/"]')) root.classList.remove('crate-scroll-active');
    }
    document.addEventListener('click', releaseSmoothScroll, true);
    return () => {
      document.removeEventListener('click', releaseSmoothScroll, true);
      root.classList.remove('crate-scroll-active');
    };
  }, []);

  useEffect(() => {
    function updateFromScroll() {
      frameRef.current = null;
      let nextIndex = 0;
      let distance = Number.POSITIVE_INFINITY;
      sectionRefs.current.forEach((section, index) => {
        if (!section) return;
        const candidateDistance = Math.abs(section.getBoundingClientRect().top);
        if (candidateDistance >= distance) return;
        distance = candidateDistance;
        nextIndex = index;
      });
      setActiveIndex(nextIndex);
    }

    function scheduleUpdate() {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(updateFromScroll);
    }

    updateFromScroll();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  /** Remember the record for the way back, and drop smooth scrolling so the next page lands at its top. */
  function prepareToLeave(slug: string) {
    window.history.replaceState(window.history.state, '', `#${slug}`);
    document.documentElement.classList.remove('crate-scroll-active');
  }

  const openProject = useCallback((index: number) => {
    const { slug } = projects[index];
    prepareToLeave(slug);
    router.push(`/projects/${slug}`);
  }, [projects, router]);

  return (
    <main className="crate-prototype">
      <AmbientField ambience={ambience} />
      <div className="crate-visual-panel" aria-label={`Record crate showing ${projects[activeIndex].title}`}>
        <RecordCrate
          projects={projects}
          activeIndex={activeIndex}
          onOpen={openProject}
          pullTransition={pullTransition}
        />
      </div>

      <div className="crate-copy-track">
        {projects.map((project, index) => {
          const Heading = index === 0 ? 'h1' : 'h2';
          return (
            <section
              key={project.slug}
              id={project.slug}
              ref={(node) => { sectionRefs.current[index] = node; }}
              className={`crate-story${index === activeIndex ? ' is-active' : ''}`}
              aria-labelledby={`${project.slug}-title`}
            >
              <div className="crate-story-copy">
                <div className="crate-story-meta">
                  <span>{labelCode(projects.length, index)}</span>
                  <span>{project.year}</span>
                  <span>{project.format}</span>
                </div>
                <Heading id={`${project.slug}-title`}>{project.title}</Heading>
                <p>{project.summary}</p>
                <Link href={`/projects/${project.slug}`} onClick={() => prepareToLeave(project.slug)}>
                  view project <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </section>
          );
        })}
      </div>
      <div className="crate-progress" aria-hidden="true">
        <span>{labelCode(projects.length, activeIndex)}</span>
        <span>{String(activeIndex + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span>
      </div>
    </main>
  );
}
