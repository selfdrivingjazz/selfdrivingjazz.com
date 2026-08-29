'use client';

import { useState } from 'react';
import Link from 'next/link';
import RecordCrate from '../RecordCrate';
import { PROJECTS } from '../data/projects';

export default function CrateExperience() {
  const [activeIndex, setActiveIndex] = useState(0);
  const project = PROJECTS[activeIndex];

  return (
    <main className="shell-main crate-main">
      <div className="crate-heading">
        <div>
          <span className="crate-kicker">method / record crate</span>
          <h1>the crate</h1>
        </div>
        <p>Projects and experiments arranged as a physical catalogue. Drag to turn the crate; click the front record to open it.</p>
      </div>
      <div className="crate-surface" aria-label={`Record crate showing ${project.title}`}>
        <RecordCrate
          projects={PROJECTS}
          activeIndex={activeIndex}
          onAdvance={() => setActiveIndex((index) => (index + 1) % PROJECTS.length)}
        />
      </div>
      <div className="crate-footer">
        <span>drag / click / explore</span>
        <Link href="/">back to releases <span aria-hidden="true">↗</span></Link>
      </div>
    </main>
  );
}
