'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { PROJECTS } from '../data/projects.js';
import RecordCrate from '../RecordCrate.jsx';

const HOME_PROJECTS = PROJECTS.slice(0, 5);
const RECORD_ADVANCE_INTERVAL_MS = 5000;
const HOME_AMBIENCE = {
  introverse: ['#3e8597', '#8d606d', '#b8874e'],
  whalechess: ['#4392b4', '#466b8e', '#a66d4e'],
  whoup: ['#218ba0', '#878e5a', '#d3ca70'],
  'bombay-beachy-yami-ichi': ['#28a5bb', '#ce6f5b', '#edcf52'],
  'coke-diffusion': ['#3f9bb7', '#b0362c', '#b0654f'],
};

export default function HomeExperience() {
  const autoAdvanceEnabledRef = useRef(true);
  const [activeProject, setActiveProject] = useState(0);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  const project = HOME_PROJECTS[activeProject];
  const ambience = HOME_AMBIENCE[project.slug];

  useEffect(() => {
    const returnSlug = new URLSearchParams(window.location.search).get('return');
    const returnIndex = HOME_PROJECTS.findIndex(({ slug }) => slug === returnSlug);
    if (returnIndex < 0) return;
    setActiveProject(returnIndex);
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
        <h2>{project.title}</h2>
        <p>{project.summary}</p>
      </aside>
    </main>
  );
}
