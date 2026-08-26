'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import RecordCrate from '../RecordCrate';
import { PROJECTS } from '../data/projects';

const sectionCopy = [
  {
    slug: 'introverse',
    id: 'opening-track',
    eyebrow: '01 / opening track',
    title: 'A crate of things that learned to move.',
    copy: 'Self-Driving Jazz is a label for projects with their own momentum: software, games, gatherings, agents, and half-serious instruments.',
    detail: 'Each sleeve is another way into the catalog. Scroll one page at a time and the crate will turn up the next project.',
    accent: '#72e0c1',
  },
  {
    slug: 'spaghettify',
    id: 'tools',
    eyebrow: '02 / tools',
    title: 'Tools should leave fingerprints.',
    copy: 'Some software exists to remove friction. These records keep a little grit in the mechanism.',
    detail: 'They turn familiar interfaces sideways and make the person using them part of the composition.',
    accent: '#ff785f',
  },
  {
    slug: 'whalechess',
    id: 'worlds',
    eyebrow: '03 / playable worlds',
    title: 'Rules first. Then mutation.',
    copy: 'A board, a protocol, a tiny fictional economy. The interesting part begins when a known game grows an impossible piece.',
    detail: 'The new piece asks everyone to renegotiate the rules together.',
    accent: '#5cb9e8',
  },
  {
    slug: 'bombay-beachy-yami-ichi',
    id: 'gatherings',
    eyebrow: '04 / gatherings',
    title: 'The internet needs folding tables.',
    copy: 'Not every network wants to be an app. Sometimes it wants a dusty market, a handmade object, or a temporary town.',
    detail: 'Sometimes it is just an excuse to meet the person hiding behind the username.',
    accent: '#f4c85b',
  },
  {
    slug: 'bella-coven',
    id: 'agents',
    eyebrow: '05 / agents',
    title: 'Let the machine into the ensemble.',
    copy: 'The agent is not the product manager. It is another player listening for an opening.',
    detail: 'Occasionally useful, occasionally uncanny, and best when the room can answer back.',
    accent: '#8bb4ff',
  },
  {
    slug: 'mulabonding',
    id: 'collective-work',
    eyebrow: '06 / collective work',
    title: 'Authorship can be a multiplayer instrument.',
    copy: 'Thirty people, five house spirits, one book. The catalog keeps returning to the same question.',
    detail: 'What can a group make when the process is legible enough for everyone to improvise?',
    accent: '#f18bd1',
  },
  {
    slug: 'viperbot',
    id: 'signal',
    eyebrow: '07 / signal',
    title: 'The next record is already in the crate.',
    copy: 'This is not a retrospective so much as a listening station.',
    detail: 'Follow a sleeve, borrow a motif, or leave the needle hovering. Another project is already entering the stack.',
    accent: '#dbff72',
  },
];

const sections = sectionCopy.map((section) => {
  const project = PROJECTS.find(({ slug }) => slug === section.slug);
  if (!project) throw new Error(`Missing crate prototype project: ${section.slug}`);
  return { ...section, project };
});
const crateProjects = sections.map(({ project }) => project);

export default function CrateScrollExperience() {
  const sectionRefs = useRef([]);
  const frameRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSection = sections[activeIndex];

  useEffect(() => {
    document.documentElement.classList.add('crate-scroll-active');
    return () => document.documentElement.classList.remove('crate-scroll-active');
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

  function advanceRecord() {
    const nextIndex = (activeIndex + 1) % sections.length;
    document.getElementById(sections[nextIndex].id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main
      className="crate-prototype"
      style={{
        '--crate-accent': activeSection.accent,
        '--crate-progress': `${(activeIndex / (sections.length - 1)) * 100}%`,
      }}
    >
      <nav className="crate-index" aria-label="Prototype sections">
        <span>the crate</span>
        <div>
          {sections.map((section, index) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={index === activeIndex ? 'is-active' : undefined}
              aria-current={index === activeIndex ? 'location' : undefined}
            >
              {String(index + 1).padStart(2, '0')}
            </a>
          ))}
        </div>
      </nav>

      <div className="crate-progress-rail" aria-hidden="true"><span /></div>

      <div className="crate-visual-panel">
        <RecordCrate
          projects={crateProjects}
          activeIndex={activeIndex}
          onAdvance={advanceRecord}
        />
        <div className="crate-now-playing" aria-live="polite">
          <span>{String(activeIndex + 1).padStart(2, '0')} / {String(sections.length).padStart(2, '0')}</span>
          <strong>{activeSection.project.title}</strong>
          <span>{activeSection.project.year}</span>
        </div>
      </div>

      <div className="crate-copy-track">
        {sections.map((section, index) => {
          const Heading = index === 0 ? 'h1' : 'h2';
          return (
            <section
              key={section.id}
              id={section.id}
              ref={(node) => { sectionRefs.current[index] = node; }}
              className={`crate-story${index === activeIndex ? ' is-active' : ''}`}
              aria-labelledby={`${section.id}-title`}
            >
              <div className="crate-story-copy">
                <p className="crate-eyebrow">{section.eyebrow}</p>
                <Heading id={`${section.id}-title`}>{section.title}</Heading>
                <p>{section.copy}</p>
                <p>{section.detail}</p>
                <Link href={`/projects/${section.project.slug}`}>
                  open {section.project.title} <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
