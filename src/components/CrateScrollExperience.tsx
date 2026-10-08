'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RecordCrate, { type CrateRecord } from '../RecordCrate';
import type { Project } from '../data/content-types';
import { CRATE_RELEASES, OLDER_WORKS_ID } from '../lib/crate';
import { labelCode } from '../lib/labels';
import { titleFitStyle } from '../lib/titleFit';
import AmbientField, { type Ambience, DEFAULT_AMBIENCE } from './AmbientField';

interface CrateStory {
  id: string;
  href: string;
  meta: string[];
  title: string;
  summary: string;
  cta: string;
  ambience: Ambience;
}

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

  const { stories, records } = useMemo(() => {
    const featured = projects.slice(0, CRATE_RELEASES);
    const older = projects.slice(CRATE_RELEASES);
    const storyList: CrateStory[] = featured.map((project, index) => ({
      id: project.slug,
      href: `/projects/${project.slug}`,
      meta: [labelCode(projects.length, index), project.year, project.format],
      title: project.title,
      summary: project.summary,
      cta: 'view project',
      ambience: project.ambience ?? DEFAULT_AMBIENCE,
    }));
    const recordList: CrateRecord[] = featured.map((project) => ({ cover: project.recordCover }));
    if (older.length > 0) {
      const range = `${labelCode(projects.length, projects.length - 1)} – ${labelCode(projects.length, CRATE_RELEASES)}`;
      storyList.push({
        id: OLDER_WORKS_ID,
        href: '/projects',
        meta: [range, `${older.length} releases`],
        title: 'Older works',
        summary: older.map((project) => project.title).join(' · '),
        cta: 'browse the catalogue',
        ambience: DEFAULT_AMBIENCE,
      });
      recordList.push({ collage: older.map((project) => project.coverUrl), title: 'older works', label: range });
    }
    return { stories: storyList, records: recordList };
  }, [projects]);
  const ambience = stories[activeIndex].ambience;

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
  function prepareToLeave(id: string) {
    window.history.replaceState(window.history.state, '', `#${id}`);
    document.documentElement.classList.remove('crate-scroll-active');
  }

  const openStory = useCallback((index: number) => {
    const { id, href } = stories[index];
    prepareToLeave(id);
    router.push(href);
  }, [stories, router]);

  return (
    <main className="crate-prototype">
      <AmbientField ambience={ambience} />
      <div className="crate-visual-panel" aria-label={`Record crate showing ${stories[activeIndex].title}`}>
        <RecordCrate
          records={records}
          activeIndex={activeIndex}
          onOpen={openStory}
          pullTransition={pullTransition}
        />
      </div>

      <div className="crate-copy-track">
        {stories.map((story, index) => {
          const Heading = index === 0 ? 'h1' : 'h2';
          return (
            <section
              key={story.id}
              id={story.id}
              ref={(node) => { sectionRefs.current[index] = node; }}
              className={`crate-story${index === activeIndex ? ' is-active' : ''}`}
              aria-labelledby={`${story.id}-title`}
            >
              <div className="crate-story-copy">
                <div className="crate-story-meta">
                  {story.meta.map((item) => <span key={item}>{item}</span>)}
                </div>
                <Heading id={`${story.id}-title`} style={titleFitStyle(story.title)}>{story.title}</Heading>
                <p>{story.summary}</p>
                <Link href={story.href} onClick={() => prepareToLeave(story.id)}>
                  {story.cta} <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
