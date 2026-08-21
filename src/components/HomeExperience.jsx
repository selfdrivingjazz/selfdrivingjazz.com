'use client';

import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PROJECTS } from '../data/projects.js';
import RecordCrate from '../RecordCrate.jsx';
import { HOME_AMBIENCE, HOME_PROJECTS } from '../data/homeProjects.js';

const RECORD_ADVANCE_INTERVAL_MS = 5000;

export default function HomeExperience({ initialProjectIndex = 0 }) {
  const autoAdvanceEnabledRef = useRef(true);
  const projectTitleRef = useRef(null);
  const [activeProject, setActiveProject] = useState(initialProjectIndex);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  const project = HOME_PROJECTS[activeProject];
  const ambience = HOME_AMBIENCE[project.slug];

  useEffect(() => {
    const returnSlug = new URLSearchParams(window.location.search).get('return');
    if (!HOME_PROJECTS.some(({ slug }) => slug === returnSlug)) return;
    window.history.replaceState(null, '', '/');
  }, []);

  useEffect(() => {
    if (!autoAdvanceEnabled) return undefined;
    const interval = window.setInterval(() => {
      if (!autoAdvanceEnabledRef.current) return;
      setActiveProject((index) => (index + 1) % HOME_PROJECTS.length);
    }, RECORD_ADVANCE_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [autoAdvanceEnabled]);

  useLayoutEffect(() => {
    const heading = projectTitleRef.current;
    const panel = heading?.parentElement;
    if (!heading || !panel) return undefined;

    let disposed = false;
    function fitProjectTitle() {
      if (disposed) return;
      heading.style.removeProperty('--active-title-size');
      if (!window.matchMedia('(max-width: 560px)').matches) return;

      const naturalSize = Number.parseFloat(window.getComputedStyle(heading).fontSize);
      const availableWidth = heading.clientWidth - 2;
      const fitRatio = Math.min(1, availableWidth / heading.scrollWidth);
      heading.style.setProperty(
        '--active-title-size',
        `${Math.max(18, Math.floor(naturalSize * fitRatio * 100) / 100)}px`,
      );
    }

    const resizeObserver = new ResizeObserver(fitProjectTitle);
    resizeObserver.observe(panel);
    fitProjectTitle();
    document.fonts?.ready.then(fitProjectTitle);

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      heading.style.removeProperty('--active-title-size');
    };
  }, [project.title]);

  function stopAutoAdvance() {
    autoAdvanceEnabledRef.current = false;
    setAutoAdvanceEnabled(false);
  }

  function handleManualAdvance() {
    stopAutoAdvance();
    setActiveProject((index) => (index + 1) % HOME_PROJECTS.length);
  }

  return (
    <main className="shell-main home-main">
      <div
        className="home-ambient"
        style={{
          '--ambient-a': ambience[0],
          '--ambient-b': ambience[1],
          '--ambient-c': ambience[2],
        }}
        aria-hidden="true"
      />

      <div className="home-records" aria-label={`Project record crate showing ${project.title}`}>
        <RecordCrate
          projects={HOME_PROJECTS}
          activeIndex={activeProject}
          onAdvance={handleManualAdvance}
        />
      </div>

      <aside className="active-project" aria-live={autoAdvanceEnabled ? 'off' : 'polite'}>
        <div className="active-project-meta">
          <span>project {String(PROJECTS.length - activeProject).padStart(3, '0')}</span>
          <Link href={`/projects/${project.slug}?from=crate`} onClick={stopAutoAdvance}>
            view project <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <h2 ref={projectTitleRef}>{project.title}</h2>
        <p>{project.summary}</p>
      </aside>
    </main>
  );
}
