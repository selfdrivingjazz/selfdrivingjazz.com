'use client';

import Link from 'next/link';
import { PROJECTS } from '../data/projects.js';

export default function ProjectList({
  projects = PROJECTS,
  activeIndex,
  includeMore = false,
  onActivate,
  onLeave,
  onOpen,
}) {
  return (
    <ol
      className="project-list"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onLeave?.();
      }}
      onMouseLeave={onLeave}
    >
      {projects.map((project, index) => (
        <li key={project.slug} className={index === activeIndex ? 'is-active' : undefined}>
          <Link
            href={`/projects/${project.slug}`}
            onClick={(event) => {
              if (!onOpen) return;
              event.preventDefault();
              onOpen(index);
            }}
            onFocus={() => onActivate?.(index)}
            onMouseEnter={() => onActivate?.(index)}
          >
            <span>{project.title}</span>
            <span>{String(index + 1).padStart(2, '0')}</span>
          </Link>
        </li>
      ))}
      {includeMore && (
        <li className="more-row">
          <Link
            href="/projects"
            onFocus={() => onActivate?.(null)}
            onMouseEnter={() => onActivate?.(null)}
          >
            <span>all projects</span><span aria-hidden="true">↗</span>
          </Link>
        </li>
      )}
    </ol>
  );
}
