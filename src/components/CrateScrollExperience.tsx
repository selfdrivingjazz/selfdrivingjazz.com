'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import RecordCrate from '../RecordCrate';
import type { MethodSection, Project } from '../data/content-types';

interface CrateScrollExperienceProps {
  sections: MethodSection[];
  projects: Project[];
}

type AmbientStyle = CSSProperties & {
  '--ambient-a': string;
  '--ambient-b': string;
  '--ambient-c': string;
};

export default function CrateScrollExperience({ sections, projects }: CrateScrollExperienceProps) {
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);
  const frameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const crateProjects = sections.map((section) => {
    const project = projects.find(({ slug }) => slug === section.projectSlug);
    if (!project) throw new Error(`Missing method project: ${section.projectSlug}`);
    return project;
  });
  const ambience = crateProjects[activeIndex].ambience ?? ['#319a83', '#703f4c', '#956e66'];

  useEffect(() => {
    document.documentElement.classList.add('crate-scroll-active');
    return () => document.documentElement.classList.remove('crate-scroll-active');
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--ambient-a', ambience[0]);
    root.style.setProperty('--ambient-b', ambience[1]);
    root.style.setProperty('--ambient-c', ambience[2]);
  }, [ambience]);

  useEffect(() => () => {
    const root = document.documentElement;
    root.style.removeProperty('--ambient-a');
    root.style.removeProperty('--ambient-b');
    root.style.removeProperty('--ambient-c');
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
      <div
        className="crate-ambient"
        style={{
          '--ambient-a': ambience[0],
          '--ambient-b': ambience[1],
          '--ambient-c': ambience[2],
        } as AmbientStyle}
        aria-hidden="true"
      />
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
          const project = crateProjects[index];
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
                <Link href={`/projects/${project.slug}`}>
                  open {project.title} <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
