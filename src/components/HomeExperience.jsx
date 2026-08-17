'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { PROJECTS } from '../data/projects.js';
import RecordCrate from '../RecordCrate.jsx';

const HOME_PROJECTS = PROJECTS.slice(0, 5);
const RECORD_ADVANCE_INTERVAL_MS = 5000;
const AUTO_ADVANCE_DISABLED_KEY = 'sdj:crate-auto-disabled';

export default function HomeExperience() {
  const autoAdvanceEnabledRef = useRef(true);
  const [activeProject, setActiveProject] = useState(0);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  const project = HOME_PROJECTS[activeProject];

  useEffect(() => {
    if (window.sessionStorage.getItem(AUTO_ADVANCE_DISABLED_KEY) === 'true') {
      autoAdvanceEnabledRef.current = false;
      setAutoAdvanceEnabled(false);
    }

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
    window.sessionStorage.setItem(AUTO_ADVANCE_DISABLED_KEY, 'true');
  }

  function handleManualAdvance() {
    stopAutoAdvance();
    setActiveProject((index) => (index + 1) % HOME_PROJECTS.length);
  }


  return (
    <main className="shell-main home-main">
      <section className="page-intro identity" aria-labelledby="home-title">
        <h1 id="home-title">self-driving jazz</h1>
        <p>experiments in recursive media</p>
      </section>


      <div className="home-records" aria-label={`Project record crate showing ${project.title}`}>
        <RecordCrate
          projects={HOME_PROJECTS}
          activeIndex={activeProject}
          onAdvance={handleManualAdvance}
        />
      </div>

      <Link
        className="active-project"
        href={`/projects/${project.slug}?from=crate`}
        onClick={stopAutoAdvance}
        aria-label={`Open ${project.title}`}
      >
        <h2>{project.title}</h2>
        <p>{project.summary}</p>
      </Link>

    </main>
  );
}
