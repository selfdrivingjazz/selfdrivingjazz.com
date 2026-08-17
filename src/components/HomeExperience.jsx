'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { PROJECTS } from '../data/projects.js';
import ProjectList from './ProjectList.jsx';
import RecordCrate from '../RecordCrate.jsx';

const HOME_PROJECTS = PROJECTS.slice(0, 5);
const RECORD_ADVANCE_INTERVAL_MS = 5000;
const AUTO_ADVANCE_DISABLED_KEY = 'sdj:crate-auto-disabled';


export default function HomeExperience() {
  const router = useRouter();
  const crateRef = useRef(null);
  const autoAdvanceEnabledRef = useRef(true);
  const [activeProject, setActiveProject] = useState(0);
  const [activeRow, setActiveRow] = useState(null);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  const [launch, setLaunch] = useState(null);
  const [returningProject, setReturningProject] = useState(null);
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
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReturningProject(HOME_PROJECTS[returnIndex]);
    }
    window.history.replaceState(null, '', '/');
  }, []);

  useEffect(() => {
    if (!autoAdvanceEnabled || activeRow !== null || launch) return undefined;
    const interval = window.setInterval(() => {
      if (!autoAdvanceEnabledRef.current) return;
      setActiveProject((index) => (index + 1) % HOME_PROJECTS.length);
    }, RECORD_ADVANCE_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [activeRow, autoAdvanceEnabled, launch]);

  function stopAutoAdvance() {
    autoAdvanceEnabledRef.current = false;
    setAutoAdvanceEnabled(false);
    window.sessionStorage.setItem(AUTO_ADVANCE_DISABLED_KEY, 'true');
  }

  function handleManualAdvance() {
    stopAutoAdvance();
    setActiveProject((index) => (index + 1) % HOME_PROJECTS.length);
    setActiveRow(null);
  }

  function openProject(index) {
    if (launch) return;
    const selectedProject = HOME_PROJECTS[index];
    setActiveProject(index);
    setActiveRow(index);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      router.push(`/projects/${selectedProject.slug}?from=crate`);
      return;
    }

    const crateBounds = crateRef.current?.getBoundingClientRect();
    const finalSize = Math.min(window.innerWidth * 0.82, window.innerHeight * 0.72, 620);
    const startSize = Math.min((crateBounds?.width ?? 360) * 0.48, 320);
    setLaunch({
      project: selectedProject,
      style: {
        width: `${finalSize}px`,
        '--launch-x': `${(crateBounds?.left ?? 0) + (crateBounds?.width ?? window.innerWidth) / 2}px`,
        '--launch-y': `${(crateBounds?.top ?? 0) + (crateBounds?.height ?? window.innerHeight) * 0.46}px`,
        '--launch-scale': startSize / finalSize,
      },
    });
  }

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
          onOpen={openProject}
        />
      </section>

      <div
        ref={crateRef}
        className="home-records"
        aria-label={`Project record crate showing ${project.title}`}
      >
        <RecordCrate
          projects={HOME_PROJECTS}
          activeIndex={activeProject}
          onAdvance={handleManualAdvance}
        />
        {returningProject && (
          <Image
            className="crate-return-cover"
            src={returningProject.recordCover}
            width={800}
            height={800}
            sizes="(max-width: 899px) 68vw, 30vw"
            alt=""
            aria-hidden="true"
            onAnimationEnd={() => setReturningProject(null)}
          />
        )}
      </div>

      <aside className="active-project" aria-live={autoAdvanceEnabled ? 'off' : 'polite'}>
        <div className="active-project-meta">
          <span>{String(activeProject + 1).padStart(2, '0')} / {String(HOME_PROJECTS.length).padStart(2, '0')}</span>
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

      {launch && (
        <div
          className="record-launch-layer"
          style={{ '--launch-art': `url("${launch.project.recordCover}")` }}
          aria-hidden="true"
        >
          <div className="record-launch-backdrop" />
          <Image
            className="record-launch-cover"
            src={launch.project.recordCover}
            width={1200}
            height={1200}
            sizes="82vw"
            alt=""
            style={launch.style}
            priority
            onAnimationEnd={() => router.push(`/projects/${launch.project.slug}?from=crate`)}
          />
        </div>
      )}
    </main>
  );
}
