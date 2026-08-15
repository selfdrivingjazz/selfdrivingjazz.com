'use client';

import { useEffect, useState } from 'react';
import { PROJECTS } from '../data/projects.js';
import ProjectList from './ProjectList.jsx';
import RecordCrate from '../RecordCrate.jsx';


export default function HomeExperience() {
  const [activeProject, setActiveProject] = useState(0);
  const [activeRow, setActiveRow] = useState(null);

  useEffect(() => {
    const automaticQuery = window.matchMedia('(max-width: 760px)');
    let interval;
    function updateAutomaticMode() {
      clearInterval(interval);
      interval = undefined;
      if (!automaticQuery.matches) {
        setActiveProject(0);
        setActiveRow(null);
        return;
      }
      interval = window.setInterval(() => {
        setActiveProject((index) => (index + 1) % PROJECTS.length);
      }, 2600);
    }
    updateAutomaticMode();
    automaticQuery.addEventListener('change', updateAutomaticMode);
    return () => {
      clearInterval(interval);
      automaticQuery.removeEventListener('change', updateAutomaticMode);
    };
  }, []);

  return (
    <main className="shell-main home-main">
      <section className="page-intro identity" aria-labelledby="home-title">
        <h1 id="home-title">self-driving jazz</h1>
        <p>experiments in recursive media</p>
      </section>

      <section className="recent" aria-label="projects">
        <ProjectList
          activeIndex={activeRow}
          includeMore
          onActivate={(index) => {
            setActiveProject(index ?? 0);
            setActiveRow(index);
          }}
          onLeave={() => {
            setActiveProject(0);
            setActiveRow(null);
          }}
        />
      </section>

      <div className="home-records" aria-label="Project record crate">
        <RecordCrate
          projects={PROJECTS}
          activeIndex={activeProject}
          onAdvance={() => {
            setActiveProject((index) => (index + 1) % PROJECTS.length);
            setActiveRow(null);
          }}
        />
      </div>
    </main>
  );
}
