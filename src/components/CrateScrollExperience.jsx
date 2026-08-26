'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import RecordCrate from '../RecordCrate';
import { PROJECTS } from '../data/projects';

const sectionCopy = [
  {
    slug: 'introverse',
    id: 'opening-track',
    title: 'A crate of things that learned to move.',
    copy: 'Self-Driving Jazz is a label for projects with their own momentum: software, games, gatherings, agents, and half-serious instruments.',
    detail: 'Each sleeve is another way into the catalog. Scroll one page at a time and the crate will turn up the next project.',
  },
  {
    slug: 'spaghettify',
    id: 'tools',
    title: 'Tools should leave fingerprints.',
    copy: 'Some software exists to remove friction. These records keep a little grit in the mechanism.',
    detail: 'They turn familiar interfaces sideways and make the person using them part of the composition.',
  },
  {
    slug: 'whalechess',
    id: 'worlds',
    title: 'Rules first. Then mutation.',
    copy: 'A board, a protocol, a tiny fictional economy. The interesting part begins when a known game grows an impossible piece.',
    detail: 'The new piece asks everyone to renegotiate the rules together.',
  },
  {
    slug: 'bombay-beachy-yami-ichi',
    id: 'gatherings',
    title: 'The internet needs folding tables.',
    copy: 'Not every network wants to be an app. Sometimes it wants a dusty market, a handmade object, or a temporary town.',
    detail: 'Sometimes it is just an excuse to meet the person hiding behind the username.',
  },
  {
    slug: 'bella-coven',
    id: 'agents',
    title: 'Let the machine into the ensemble.',
    copy: 'The agent is not the product manager. It is another player listening for an opening.',
    detail: 'Occasionally useful, occasionally uncanny, and best when the room can answer back.',
  },
  {
    slug: 'mulabonding',
    id: 'collective-work',
    title: 'Authorship can be a multiplayer instrument.',
    copy: 'Thirty people, five house spirits, one book. The catalog keeps returning to the same question.',
    detail: 'What can a group make when the process is legible enough for everyone to improvise?',
  },
  {
    slug: 'viperbot',
    id: 'signal',
    title: 'The next record is already in the crate.',
    copy: 'This is not a retrospective so much as a listening station.',
    detail: 'Follow a sleeve, borrow a motif, or leave the needle hovering. Another project is already entering the stack.',
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
    <main className="crate-prototype">

      <div className="crate-visual-panel">
        <RecordCrate
          projects={crateProjects}
          activeIndex={activeIndex}
          onAdvance={advanceRecord}
        />
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
