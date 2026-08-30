'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Project } from '../data/content-types';

interface HomeExperienceProps {
  projects: Project[];
  scrollAmbience?: boolean;
}

function releaseNumber(projects: Project[], index: number) {
  return String(projects.length - index).padStart(3, '0');
}

function mixHex(left: string, right: string, amount: number): string {
  const leftRgb = left.match(/[a-f\d]{2}/gi)?.map((part) => Number.parseInt(part, 16)) ?? [8, 8, 8];
  const rightRgb = right.match(/[a-f\d]{2}/gi)?.map((part) => Number.parseInt(part, 16)) ?? leftRgb;
  return `#${leftRgb.map((channel, index) => Math.round(channel + (rightRgb[index] - channel) * amount).toString(16).padStart(2, '0')).join('')}`;
}

function ambienceFor(project: Project): readonly [string, string, string] {
  return project.ambience ?? ['#319a83', '#703f4c', '#956e66'];
}

function useScrollAmbience(projects: Project[], enabled: boolean) {
  useEffect(() => {
    if (!enabled) return undefined;

    const root = document.documentElement;
    let frame = 0;

    function update() {
      frame = 0;
      const scrollableHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / scrollableHeight));
      const position = progress * (projects.length - 1);
      const leftIndex = Math.floor(position);
      const rightIndex = Math.min(projects.length - 1, leftIndex + 1);
      const amount = position - leftIndex;
      const left = ambienceFor(projects[leftIndex]);
      const right = ambienceFor(projects[rightIndex]);

      root.style.setProperty('--ambient-a', mixHex(left[0], right[0], amount));
      root.style.setProperty('--ambient-b', mixHex(left[1], right[1], amount));
      root.style.setProperty('--ambient-c', mixHex(left[2], right[2], amount));
    }

    function scheduleUpdate() {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    }

    scheduleUpdate();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (frame !== 0) window.cancelAnimationFrame(frame);
      root.style.removeProperty('--ambient-a');
      root.style.removeProperty('--ambient-b');
      root.style.removeProperty('--ambient-c');
    };
  }, [enabled, projects]);
}

export default function HomeExperience({ projects, scrollAmbience = false }: HomeExperienceProps) {
  useScrollAmbience(projects, scrollAmbience);
  const latest = projects[0];
  const backlog = projects.slice(1);

  return (
    <main className="shell-main home-main">
      <section className="latest-release" aria-labelledby="latest-release-title">
        <ReleaseRule label="" detail={`sdj—${releaseNumber(projects, 0)} / ${latest.year}`} />
        <Link className="latest-release-link" href={`/projects/${latest.slug}`}>
          <div className="latest-release-art">
            <Image
              src={latest.coverUrl}
              width={1200}
              height={1200}
              sizes="(min-width: 900px) 50vw, 100vw"
              priority
              alt={latest.coverAlt}
            />
          </div>
          <div className="latest-release-copy">
            <div className="release-kicker">
              <span>{latest.format}</span>
              <span>{latest.status}</span>
            </div>
            <h1 id="latest-release-title">{latest.title}</h1>
            <p>{latest.summary}</p>
            <span className="release-cta">open release <span aria-hidden="true">↗</span></span>
          </div>
        </Link>
      </section>

      <section className="back-catalog" aria-labelledby="back-catalog-title">
        <ReleaseRule label="back catalogue" detail={`${backlog.length} releases`} />
        <ol className="back-catalog-list" id="back-catalog-title">
          {backlog.map((project, index) => (
            <li key={project.slug}>
              <Link className="catalog-release" href={`/projects/${project.slug}`}>
                <span className="catalog-art"><Image src={project.coverUrl} width={420} height={420} sizes="120px" alt="" /></span>
                <span className="catalog-copy">
                  <span className="catalog-meta"><span className="catalog-number">sdj—{releaseNumber(projects, index + 1)}</span><span aria-hidden="true">/</span>{project.year}</span>
                  <span className="catalog-title">{project.title}</span>
                  <span className="catalog-summary">{project.summary}</span>
                </span>
                <span className="catalog-arrow" aria-hidden="true">↗</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

function ReleaseRule({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="release-rule">
      <span>{label}</span>
      <span>{detail}</span>
    </div>
  );
}
