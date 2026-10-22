'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import RecordCrate, { type CoverSide, type CrateRecord, type RecordCrateHandle } from '../RecordCrate';
import type { OlderWorksSleeve, Project } from '../data/content-types';
import { OLDER_WORKS_ID, splitCrate } from '../lib/crate';
import { optimizedImageUrl } from '../lib/imageUrl';
import { labelCode } from '../lib/labels';
import { titleFitStyle } from '../lib/titleFit';
import type { Ambience } from './AmbientField';
import CrateBackdrop from './CrateBackdrop';

/** Older releases named in the "older works" blurb before collapsing to "and N more". */
const OLDER_WORKS_LISTED = 4;
/**
 * Distance (px) over which copy fades as it slides under the crate on narrow screens. The crate there keeps half
 * of it clear above the tallest copy (`--crate-height` in styles.css), so copy at rest is shown in full.
 */
const COPY_FADE_DISTANCE = 72;
/** Without `scrollend`, a scroll counts as finished once no scroll event has arrived for this long (ms). */
const SCROLL_IDLE_MS = 160;

/** Scroll snap event (not yet in every DOM typing): the section a gesture is heading for. */
type SnapEvent = Event & { snapTargetBlock?: Element | null };

interface CrateStory {
  id: string;
  /** Internal page the secondary button opens: the project's credits, or the catalogue. */
  href: string;
  meta: string[];
  title: string;
  summary: string;
  cta: string;
  /** The live project, opened by the primary "visit" button; absent when it is not online. */
  visitUrl?: string;
  /** Palettes sampled from the sleeve's artwork: front cover, and reverse (the front again when there is none). */
  ambience: Ambience;
  backAmbience: Ambience;
}

/** Opt in with `?pull=1`, opt out with `?pull=0`; the choice persists per browser. */
const PULL_TRANSITION_KEY = 'sdj:pull-transition';

function readPullTransitionPreference(): boolean {
  const requested = new URLSearchParams(window.location.search).get('pull');
  if (requested === '1') window.localStorage.setItem(PULL_TRANSITION_KEY, '1');
  if (requested === '0') window.localStorage.removeItem(PULL_TRANSITION_KEY);
  return window.localStorage.getItem(PULL_TRANSITION_KEY) === '1';
}

interface CrateScrollExperienceProps {
  projects: Project[];
  olderWorks: OlderWorksSleeve;
}

export default function CrateScrollExperience({ projects, olderWorks }: CrateScrollExperienceProps) {
  const router = useRouter();
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const frameRef = useRef<number | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const crateRef = useRef<RecordCrateHandle | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeSide, setActiveSide] = useState<CoverSide>('front');
  /** A record chosen ahead of the scroll (crate flip or pending snap), kept active until the scroll lands or stops. */
  const heldIndexRef = useRef<number | null>(null);
  const [pullTransition, setPullTransition] = useState(false);

  const { stories, records } = useMemo(() => {
    const { featured, older } = splitCrate(projects);
    const storyList: CrateStory[] = featured.map((project) => ({
      id: project.slug,
      href: `/projects/${project.slug}`,
      meta: [labelCode(project.catalog), project.year],
      title: project.title,
      summary: project.summary,
      cta: 'credits',
      visitUrl: project.outboundUrl ?? undefined,
      ambience: project.ambience,
      backAmbience: project.backAmbience ?? project.ambience,
    }));
    const recordList: CrateRecord[] = featured.map((project) => ({
      cover: optimizedImageUrl(project.recordCover, 828),
      fallbackCover: project.recordCover,
      backCover: project.backCoverUrl ? optimizedImageUrl(project.backCoverUrl, 828) : undefined,
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
        ambience: olderWorks.ambience,
        backAmbience: olderWorks.backAmbience ?? olderWorks.ambience,
      });
      recordList.push({
        cover: optimizedImageUrl(olderWorks.coverUrl, 828),
        fallbackCover: olderWorks.coverUrl,
        backCover: olderWorks.backCoverUrl ? optimizedImageUrl(olderWorks.backCoverUrl, 828) : undefined,
        color: olderWorks.coverColor,
      });
    }
    return { stories: storyList, records: recordList };
  }, [projects, olderWorks]);
  const activeStory = stories[activeIndex];
  const ambience = activeSide === 'back' ? activeStory.backAmbience : activeStory.ambience;

  // On narrow portrait screens the copy sits under the crate, which takes the height the tallest entry's copy
  // leaves free (`--crate-height` in styles.css): one crate for every record, and every copy fits in full.
  // Measured before the crate's renderer starts, and again whenever a copy's height changes (fonts, width).
  useLayoutEffect(() => {
    const main = mainRef.current;
    if (!main) return undefined;
    const copies = sectionRefs.current.flatMap((section) => section?.firstElementChild ?? []);
    const measureCopy = () => {
      const tallest = Math.max(0, ...copies.map((copy) => copy.getBoundingClientRect().height));
      main.style.setProperty('--crate-copy-height', `${Math.ceil(tallest)}px`);
    };
    measureCopy();
    const observer = new ResizeObserver(measureCopy);
    for (const copy of copies) observer.observe(copy);
    return () => observer.disconnect();
  }, [stories]);

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
      // A record picked ahead of the scroll stays active until the scroll reaches it (or stops elsewhere).
      if (heldIndexRef.current === nextIndex) heldIndexRef.current = null;
      setActiveIndex(heldIndexRef.current ?? nextIndex);
    }

    function requestUpdate() {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(updateFromScroll);
    }

    function releaseHeldIndex() {
      heldIndexRef.current = null;
      requestUpdate();
    }

    const scrollEndSupported = 'onscrollend' in window;
    let idleTimer: number | undefined;
    function handleScroll() {
      if (!scrollEndSupported) {
        window.clearTimeout(idleTimer);
        idleTimer = window.setTimeout(releaseHeldIndex, SCROLL_IDLE_MS);
      }
      requestUpdate();
    }

    // Where supported, the snap target is known as soon as a gesture commits, well before it lands.
    function handleSnapChanging(event: Event) {
      const target = (event as SnapEvent).snapTargetBlock;
      const index = target ? sectionRefs.current.indexOf(target as HTMLElement) : -1;
      if (index < 0) return;
      heldIndexRef.current = index;
      setActiveIndex(index);
    }

    updateFromScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('scrollend', releaseHeldIndex);
    window.addEventListener('scrollsnapchanging', handleSnapChanging);
    window.addEventListener('resize', requestUpdate);
    // The crate's height follows the copy (see measureCopy), and with it the line where copy starts to fade.
    const panelObserver = new ResizeObserver(requestUpdate);
    if (panelRef.current) panelObserver.observe(panelRef.current);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scrollend', releaseHeldIndex);
      window.removeEventListener('scrollsnapchanging', handleSnapChanging);
      window.removeEventListener('resize', requestUpdate);
      panelObserver.disconnect();
      window.clearTimeout(idleTimer);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  /** Remember the record for the way back, and drop smooth scrolling so the next page lands at its top. */
  function prepareToLeave(id: string) {
    window.history.replaceState(window.history.state, '', `#${id}`);
    document.documentElement.classList.remove('crate-scroll-active');
  }

  /** A crate flip selects the next record at once; the copy scrolls after it. */
  const advance = useCallback(() => {
    const next = (activeIndex + 1) % stories.length;
    heldIndexRef.current = next;
    setActiveIndex(next);
    sectionRefs.current[next]?.scrollIntoView({ behavior: 'smooth' });
  }, [activeIndex, stories.length]);

  /** With the opt-in pull transition, the record leaves the crate before the project page opens. */
  function openStory(event: ReactMouseEvent<HTMLAnchorElement>, index: number) {
    const { id, href } = stories[index];
    prepareToLeave(id);
    if (!pullTransition || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const crate = crateRef.current;
    if (crate) crate.pullOut(index, () => router.push(href));
    else router.push(href);
  }

  return (
    <main className="crate-prototype" ref={mainRef}>
      <CrateBackdrop ambience={ambience} activeIndex={activeIndex} activeSide={activeSide} />
      <div className="crate-visual-panel" ref={panelRef} aria-label={`Record crate showing ${activeStory.title}`}>
        <RecordCrate
          ref={crateRef}
          records={records}
          activeIndex={activeIndex}
          onAdvance={advance}
          onActiveSideChange={setActiveSide}
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
                <div className="crate-story-actions">
                  {story.visitUrl && (
                    <a className="is-primary" href={story.visitUrl} target="_blank" rel="noreferrer">
                      visit
                    </a>
                  )}
                  <Link href={story.href} onClick={(event) => openStory(event, index)}>{story.cta}</Link>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
