'use client';

import { useEffect, useState } from 'react';
import { PROJECTS } from '../data/projects.js';
import ProjectList from './ProjectList.jsx';
import RecordCrate from '../RecordCrate.jsx';

const HOME_PROJECTS = PROJECTS.slice(0, 5);
const RECORD_ADVANCE_INTERVAL_MS = 5000;


export default function HomeExperience() {
  const [activeProject, setActiveProject] = useState(0);
  const [activeRow, setActiveRow] = useState(null);

  useEffect(() => {
    if (activeRow !== null) return undefined;
    const interval = window.setInterval(() => {
      setActiveProject((index) => (index + 1) % HOME_PROJECTS.length);
    }, RECORD_ADVANCE_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [activeRow]);

  return (
    <main className="shell-main home-main">
      <section className="page-intro identity" aria-labelledby="home-title">
        <h1 id="home-title">self-driving jazz</h1>
        <p>experiments in recursive media</p>
      </section>

      <section className="recent" aria-label="projects">
        <ProjectList
          projects={HOME_PROJECTS}
          activeIndex={activeRow}
          includeMore
          onActivate={(index) => {
            if (index === null) {
              setActiveRow(null);
              return;
            }
            setActiveProject(index);
            setActiveRow(index);
          }}
          onLeave={() => setActiveRow(null)}
        />
      </section>

      <div
        className="home-records"
        aria-label={`Project record crate showing ${HOME_PROJECTS[activeProject].title}`}
      >
        <RecordCrate
          projects={HOME_PROJECTS}
          activeIndex={activeProject}
          onAdvance={() => {
            setActiveProject((index) => (index + 1) % HOME_PROJECTS.length);
            setActiveRow(null);
          }}
        />
      </div>
    </main>
  );
}
