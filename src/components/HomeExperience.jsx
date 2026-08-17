'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { PROJECTS } from '../data/projects.js';
import RecordCrate from '../RecordCrate.jsx';

const HOME_PROJECTS = PROJECTS.slice(0, 5);
const RECORD_ADVANCE_INTERVAL_MS = 5000;
const AUTO_ADVANCE_DISABLED_KEY = 'sdj:crate-auto-disabled';

export default function HomeExperience() {
  const router = useRouter();
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

  function openProject(index) {
    const selectedProject = HOME_PROJECTS[index];
    stopAutoAdvance();
    setActiveProject(index);
    router.push(`/projects/${selectedProject.slug}?from=crate`);
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

      <aside className="active-project" aria-live={autoAdvanceEnabled ? 'off' : 'polite'}>
        <div className="active-project-meta">
          <span>project {String(activeProject + 1).padStart(2, '0')} of {String(HOME_PROJECTS.length).padStart(2, '0')}</span>
          <span>{project.year}</span>
        </div>
        <div className="active-project-copy">
          <h2>{project.title}</h2>
          <p>{project.summary}</p>
        </div>
        <div className="active-project-actions">
          <button type="button" onClick={() => openProject(activeProject)}>
            open project <span aria-hidden="true">↗</span>
          </button>
          <Link href="/projects">all projects</Link>
        </div>
      </aside>

    </main>
  );
}
