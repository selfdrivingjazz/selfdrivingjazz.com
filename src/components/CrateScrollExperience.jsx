'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { PROJECTS } from '../data/projects';


const sectionCopy = [
  {
    slug: 'introverse',
    id: 'opening-track',
    eyebrow: '01 / opening track',
    title: 'A crate of things that learned to move.',
    copy: 'Self-Driving Jazz is a label for projects with their own momentum: software, games, gatherings, agents, and half-serious instruments. Scroll slowly. Every sleeve is another way into the catalog.',
    accent: '#72e0c1',
  },
  {
    slug: 'spaghettify',
    id: 'tools',
    eyebrow: '02 / tools',
    title: 'Tools should leave fingerprints.',
    copy: 'Some software exists to remove friction. These records keep a little grit in the mechanism. They turn familiar interfaces sideways and make the person using them part of the composition.',
    accent: '#ff785f',
  },
  {
    slug: 'whalechess',
    id: 'worlds',
    eyebrow: '03 / playable worlds',
    title: 'Rules first. Then mutation.',
    copy: 'A board, a protocol, a tiny fictional economy. The interesting part begins when a known game grows an impossible piece and asks everyone to renegotiate the rules together.',
    accent: '#5cb9e8',
  },
  {
    slug: 'bombay-beachy-yami-ichi',
    id: 'gatherings',
    eyebrow: '04 / gatherings',
    title: 'The internet needs folding tables.',
    copy: 'Not every network wants to be an app. Sometimes it wants a dusty market, a handmade object, a temporary town, or an excuse to meet the person hiding behind the username.',
    accent: '#f4c85b',
  },
  {
    slug: 'bella-coven',
    id: 'agents',
    eyebrow: '05 / agents',
    title: 'Let the machine into the ensemble.',
    copy: 'The agent is not the product manager. It is another player listening for an opening: occasionally useful, occasionally uncanny, and best when the room can answer back.',
    accent: '#8bb4ff',
  },
  {
    slug: 'mulabonding',
    id: 'collective-work',
    eyebrow: '06 / collective work',
    title: 'Authorship can be a multiplayer instrument.',
    copy: 'Thirty people, five house spirits, one book. The catalog keeps returning to the same question: what can a group make when the process is legible enough for everyone to improvise?',
    accent: '#f18bd1',
  },
  {
    slug: 'viperbot',
    id: 'signal',
    eyebrow: '07 / signal',
    title: 'The next record is already in the crate.',
    copy: 'This is not a retrospective so much as a listening station. Follow a sleeve, borrow a motif, or leave the needle hovering. There is always another project entering the stack.',
    accent: '#dbff72',
  },
];


const sections = sectionCopy.map((section) => {
  const project = PROJECTS.find(({ slug }) => slug === section.slug);
  if (!project) throw new Error(`Missing crate prototype project: ${section.slug}`);
  return { ...section, project };
});

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export default function CrateScrollExperience() {
  const sectionRefs = useRef([]);
  const frameRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sectionProgress, setSectionProgress] = useState(0);
  const activeSection = sections[activeIndex];

  useEffect(() => {
    document.documentElement.classList.add('crate-scroll-active');
    return () => document.documentElement.classList.remove('crate-scroll-active');
  }, []);

  useEffect(() => {
    function updateFromScroll() {
      frameRef.current = null;
      let currentIndex = 0;
      sectionRefs.current.forEach((section, index) => {
        if (!section) return;
        if (section.getBoundingClientRect().top <= 1) currentIndex = index;
      });
      const currentSection = sectionRefs.current[currentIndex];
      const progress = currentSection
        ? clamp(-currentSection.getBoundingClientRect().top / currentSection.getBoundingClientRect().height, 0, 1)
        : 0;

      setActiveIndex(currentIndex);
      setSectionProgress(progress);
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

  const prototypeStyle = {
    '--crate-accent': activeSection.accent,
    '--crate-progress': `${((activeIndex + sectionProgress) / (sections.length - 1)) * 100}%`,
  };
  return (
    <main className="crate-prototype" style={prototypeStyle}>
      <nav className="crate-index" aria-label="Prototype sections">
        <span className="crate-index-label">the crate</span>
        <div className="crate-index-links">
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

      <div className="crate-stage" aria-hidden="true">
        <div className="crate-stage-halo" />
        <div className="crate-stack">
          {sections.map((section, index) => {
            const relative = index - activeIndex - sectionProgress;
            const depth = Math.max(0, relative);
            const passed = relative < -1;
            const transform = relative < 0
              ? `translate3d(${relative * 34}%, ${relative * 78}%, ${relative * 120}px) rotateZ(${relative * 8}deg) rotateX(${relative * -8}deg)`
              : `translate3d(${depth * 2.2}%, ${depth * -2.6}%, ${depth * -46}px) rotateZ(${depth * -1.5}deg)`;
            return (
              <div
                key={section.id}
                className="crate-scroll-cover"
                style={{
                  opacity: passed ? 0 : clamp(1 - Math.max(0, depth - 4) * 0.18, 0.15, 1),
                  transform,
                  zIndex: sections.length - index,
                }}
              >
                <Image
                  src={section.project.recordCover}
                  alt=""
                  fill
                  sizes="(max-width: 760px) 68vw, 34vw"
                  priority={index < 2}
                />
              </div>
            );
          })}
          <div className="crate-lip"><span>SDJ</span><span>33⅓</span></div>
        </div>
        <div className="crate-now-playing">
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
                <Link href={`/projects/${section.project.slug}`}>
                  open {section.project.title} <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </section>
          );
        })}
      </div>

      <p className="crate-scroll-cue" aria-hidden="true">scroll to dig</p>
    </main>
  );
}
