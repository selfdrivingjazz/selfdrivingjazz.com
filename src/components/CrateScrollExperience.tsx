'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import RecordCrate, { type CrateRecord } from '../RecordCrate';
import type { Project } from '../data/content-types';
import { CRATE_RELEASES, OLDER_WORKS_ID } from '../lib/crate';
import { optimizedImageUrl } from '../lib/imageUrl';
import { labelCode } from '../lib/labels';
import { titleFitStyle } from '../lib/titleFit';
import AmbientField, { type Ambience, DEFAULT_AMBIENCE } from './AmbientField';

/** Older releases named in the "older works" blurb before collapsing to "and N more". */
const OLDER_WORKS_LISTED = 4;
/** Distance (px) over which copy fades as it slides under the crate on narrow screens. */
const COPY_FADE_DISTANCE = 72;

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
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pullTransition, setPullTransition] = useState(false);

  const { stories, records } = useMemo(() => {
    const featured = projects.slice(0, CRATE_RELEASES);
    const older = projects.slice(CRATE_RELEASES);
    const storyList: CrateStory[] = featured.map((project, index) => ({
      id: project.slug,
      href: `/projects/${project.slug}`,
      meta: [labelCode(project.catalog), project.year],
      title: project.title,
      summary: project.summary,
      cta: 'view project',
      ambience: project.ambience ?? DEFAULT_AMBIENCE,
    }));
    const recordList: CrateRecord[] = featured.map((project) => ({
      cover: optimizedImageUrl(project.recordCover, 828),
      fallbackCover: project.recordCover,
      color: project.coverColor,
    }));
    if (older.length > 0) {
      const range = `${labelCode(older[older.length - 1].catalog)} – ${labelCode(older[0].catalog)}`;
      storyList.push({
        id: OLDER_WORKS_ID,
        href: '/projects',
        meta: [range, `${older.length} releases`],
        title: 'Older works',
        summary: older.length > OLDER_WORKS_LISTED
          ? `${older.slice(0, OLDER_WORKS_LISTED).map((project) => project.title).join(' · ')} · and ${older.length - OLDER_WORKS_LISTED} more`
          : older.map((project) => project.title).join(' · '),
        cta: 'browse the catalogue',
        ambience: DEFAULT_AMBIENCE,
      });
      recordList.push({ collage: older.map((project) => optimizedImageUrl(project.coverUrl, 384)), title: 'older works', label: range });
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
    // Links that leave this page (header menu included) must do so without smooth scrolling, or Next's
    // scroll-to-top stalls midway. A link back to this page (the logo) returns to the first record.
    function handleLinkClick(event: MouseEvent) {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="/"]') : null;
      if (!link) return;
      if (link.pathname !== window.location.pathname) root.classList.remove('crate-scroll-active');
      else if (!link.hash) window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    document.addEventListener('click', handleLinkClick, true);
    return () => {
      document.removeEventListener('click', handleLinkClick, true);
      root.classList.remove('crate-scroll-active');
    };
  }, []);

  useEffect(() => {
    function updateFromScroll() {
      frameRef.current = null;
      let nextIndex = 0;
      let distance = Number.POSITIVE_INFINITY;
      // On narrow screens the crate sits above the copy; copy fades out before passing beneath it.
      const panelBottom = panelRef.current?.getBoundingClientRect().bottom ?? 0;
      sectionRefs.current.forEach((section, index) => {
        if (!section) return;
        const candidateDistance = Math.abs(section.getBoundingClientRect().top);
        const copy = section.firstElementChild as HTMLElement | null;
        if (copy) {
          const reveal = (copy.getBoundingClientRect().top - panelBottom + COPY_FADE_DISTANCE / 2) / COPY_FADE_DISTANCE;
          copy.style.setProperty('--copy-reveal', String(Math.min(1, Math.max(0, reveal))));
        }
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
      <div className="crate-visual-panel" ref={panelRef} aria-label={`Record crate showing ${stories[activeIndex].title}`}>
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
