import { lazy, Suspense, useEffect, useRef, useState } from 'react';

const MachineCanvas = lazy(() => import('./MachineCanvas.jsx'));
const RecordCrate = lazy(() => import('./RecordCrate.jsx'));

const PROJECTS = [
  {
    slug: 'project-001',
    label: 'project 001',
    title: 'Ambient Instruments',
    summary: 'A family of procedural machines that behave like instruments, interfaces, and small pieces of speculative infrastructure.',
    year: '2026',
    status: 'ongoing',
    format: 'generative web system',
    collaborators: 'Self-Driving Jazz',
    recordCover: '/records/0.webp',
    coverUrl: 'https://images.unsplash.com/photo-1772149394594-69b6d73302de?auto=format&fit=crop&w=1800&q=85',
    coverAlt: 'A modular synthesizer covered in knobs, patch points, and control markings.',
    creditName: 'Egor Komarov',
    creditUrl: 'https://unsplash.com/photos/bS19G9IbI78',
    outboundUrl: 'https://selfdrivingjazz.com',
    body: [
      'Ambient Instruments asks what happens when a website behaves less like a document and more like a device. Each visit assembles a machine from a deterministic seed: recognizable controls, unfamiliar architecture, and enough internal logic to suggest a purpose without explaining it away.',
      'The system is built from a compositional grammar rather than a catalog of finished models. Topology, modules, control surfaces, materials, and motion are selected independently, allowing related machines to share a visual language without collapsing into a handful of repeated silhouettes.',
      'The work is an ongoing study in functional fiction. Some controls produce immediate changes, some alter the machine over time, and some exist mainly to make the visitor wonder what kind of institution would need such an object.',
    ],
  },
  {
    slug: 'project-002',
    label: 'project 002',
    title: 'Chiba Cable',
    summary: 'A broadcast experiment about agents, places, and the strange programming that accumulates between them.',
    year: '2026',
    status: 'in development',
    format: 'networked media',
    collaborators: 'Mars College',
    recordCover: '/records/1.webp',
    coverUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1800&q=85',
    coverAlt: 'A musician performing under red stage lighting.',
    creditName: 'John Matychuk',
    creditUrl: 'https://unsplash.com/photos/gUK3lA3K7Yo',
    outboundUrl: 'https://selfdrivingjazz.com',
    body: [
      'Chiba Cable treats a community agent as both a useful interface and a television character. It collects local transmissions, introduces unfinished work, and gives recurring activity a recognizable voice.',
      'The project is being developed as a sequence of small broadcasts rather than one continuous feed. Each episode should be useful to the people involved while remaining strange enough to reward an accidental audience.',
    ],
  },
  {
    slug: 'project-003',
    label: 'project 003',
    title: 'Transmission Studies',
    summary: 'Short investigations into how autonomous media acquires a point of view.',
    year: '2025–26',
    status: 'active',
    format: 'research and publishing',
    collaborators: 'Various',
    recordCover: '/records/2.webp',
    coverUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1800&q=85',
    coverAlt: 'A recording studio mixing desk and computer display.',
    creditName: 'Techivation',
    creditUrl: 'https://unsplash.com/photos/_fP7E6ePEwQ',
    outboundUrl: 'https://selfdrivingjazz.com',
    body: [
      'Transmission Studies is a running collection of prototypes, essays, and media objects concerned with autonomous production. The unit of work is a finished transmission: something another person can encounter, not merely a system that could eventually make things.',
      'The studies move between software, performance, publishing, and institutional fiction. Their shared question is simple: what would make machine-assisted media feel authored rather than merely generated?',
    ],
  },
  {
    slug: 'project-004',
    label: 'project 004',
    title: 'Ambient Communal Intelligence',
    summary: 'A configurable intelligence layer for welcoming, coaching, connecting, and stewarding communities.',
    year: '2026',
    status: 'prototype',
    format: 'protocol and community software',
    collaborators: 'BestPossible.ai + Mars College',
    recordCover: '/records/3.webp',
    coverUrl: '/records/3.webp',
    coverAlt: 'A retrofuturist illustrated record sleeve titled Bella Coven.',
    creditLabel: 'Artwork',
    creditName: 'Self-Driving Jazz archive',
    creditUrl: 'https://github.com/jmilldotdev/selfrdrivingjazz.com',
    creditSuffix: '',
    outboundUrl: 'https://selfdrivingjazz.com',
    body: [
      'Ambient Communal Intelligence is a pattern for useful intelligence that lives with a community rather than above it. Greeter, Coach, Connector, and Steward functions share context while retaining explicit boundaries around privacy, consent, evidence, and human authority.',
      'The first prototypes apply the protocol to BestPossible.ai and Mars College. The implementation explores both event-driven services and long-running agent processes without making either architecture part of the protocol itself.',
    ],
  },
  {
    slug: 'project-005',
    label: 'project 005',
    title: 'Agent Arcade',
    summary: 'A playable environment for encountering agent behavior as something more legible than a benchmark score.',
    year: '2026',
    status: 'in development',
    format: 'interactive software',
    collaborators: 'Self-Driving Jazz',
    recordCover: '/records/4.webp',
    coverUrl: '/records/4.webp',
    coverAlt: 'A colorful illustrated record sleeve titled Whoup.',
    creditLabel: 'Artwork',
    creditName: 'Self-Driving Jazz archive',
    creditUrl: 'https://github.com/jmilldotdev/selfrdrivingjazz.com',
    creditSuffix: '',
    outboundUrl: 'https://selfdrivingjazz.com',
    body: [
      'Agent Arcade treats evaluation as an encounter. Instead of reducing an agent to a leaderboard row, it creates small playable situations in which behavior, judgment, style, and failure can be observed directly.',
      'The project asks what changes when a benchmark becomes a venue: something people can visit, compare, discuss, and develop taste around.',
    ],
  },
];

function machineSeed() {
  const parameter = new URLSearchParams(window.location.search).get('seed');
  const requestedSeed = Number(parameter);
  if (parameter !== null && Number.isInteger(requestedSeed) && requestedSeed >= 0) return requestedSeed >>> 0;
  const value = new Uint32Array(1);
  window.crypto.getRandomValues(value);
  return value[0];
}

const HOME_MACHINE_SEED = machineSeed();

function Logo({ large = false }) {
  return (
    <img
      className={large ? 'logo logo-large' : 'logo'}
      src="/sdj-logo.jpg"
      alt="Self-Driving Jazz shrimp playing saxophone"
    />
  );
}

function Header({ current }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function handlePointerDown(event) {
      if (!headerRef.current?.contains(event.target)) setMenuOpen(false);
    }
    function handleKeyDown(event) {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const activePage = current ?? (
    window.location.pathname === '/'
      ? 'home'
      : window.location.pathname.startsWith('/projects')
        ? 'projects'
        : window.location.pathname === '/machine'
          ? 'machine'
          : undefined
  );

  return (
    <header className="header" ref={headerRef}>
      <a href="/" aria-label="Self-Driving Jazz home"><Logo /></a>
      <button
        ref={buttonRef}
        className="menu-link"
        type="button"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-controls="site-menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
      </button>
      <nav id="site-menu" className={`site-menu${menuOpen ? ' is-open' : ''}`} aria-label="Site">
        <a href="/" aria-current={activePage === 'home' ? 'page' : undefined}>home</a>
        <a href="/projects" aria-current={activePage === 'projects' ? 'page' : undefined}>projects</a>
        <a href="/machine" aria-current={activePage === 'machine' ? 'page' : undefined}>machine</a>
        <a href="/about" aria-current={activePage === 'about' ? 'page' : undefined}>about</a>
        <a href="https://github.com/selfdrivingjazz" target="_blank" rel="noreferrer">github <span aria-hidden="true">↗</span></a>
        <a href="https://x.com/selfdrivingjazz" target="_blank" rel="noreferrer">x <span aria-hidden="true">↗</span></a>
      </nav>
    </header>
  );
}

function SiteShell({ children, className = '', current }) {
  return (
    <div className={`page site-shell ${className}`.trim()}>
      <Header current={current} />
      {children}
    </div>
  );
}

function ProjectList({ activeIndex, includeMore = false, onActivate, onLeave }) {
  return (
    <ol className="project-list" onMouseLeave={onLeave}>
      {PROJECTS.map((project, index) => (
        <li key={project.slug} className={index === activeIndex ? 'is-active' : undefined}>
          <a
            href={`/projects/${project.slug}`}
            onFocus={() => onActivate?.(index)}
            onMouseEnter={() => onActivate?.(index)}
          >
            <span>{project.label}</span>
            <span>{String(index + 1).padStart(2, '0')}</span>
          </a>
        </li>
      ))}
      {includeMore && (
        <li className="more-row">
          <a href="/projects"><span>more</span><span aria-hidden="true">↗</span></a>
        </li>
      )}
    </ol>
  );
}

function HomePage() {
  const [activeProject, setActiveProject] = useState(0);

  useEffect(() => {
    const automaticQuery = window.matchMedia('(max-width: 760px)');
    let interval;
    function updateAutomaticMode() {
      clearInterval(interval);
      interval = undefined;
      if (!automaticQuery.matches) {
        setActiveProject(0);
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
    <SiteShell className="home-page">
      <main className="shell-main home-main">
        <section className="page-intro identity" aria-labelledby="home-title">
          <h1 id="home-title">self-driving jazz</h1>
          <p>an autonomous media empire</p>
        </section>

        <section className="recent" aria-label="projects">
          <ProjectList
            activeIndex={activeProject}
            onActivate={setActiveProject}
            onLeave={() => setActiveProject(0)}
          />
        </section>

        <div className="home-records" aria-label="Project record crate">
          <Suspense fallback={null}>
            <RecordCrate projects={PROJECTS} activeIndex={activeProject} />
          </Suspense>
        </div>
      </main>
    </SiteShell>
  );
}

function MachinePage() {
  return (
    <SiteShell className="machine-page" current="machine">
      <main className="shell-main machine-main">
        <div className="page-intro section-heading">
          <h1>generative machine</h1>
          <a href="/">back</a>
        </div>
        <div className="machine-surface" aria-label="Evolving procedural machine">
          <Suspense fallback={null}>
            <MachineCanvas seed={HOME_MACHINE_SEED} evolution />
          </Suspense>
        </div>
      </main>
    </SiteShell>
  );
}

function ProjectsPage() {
  return (
    <SiteShell className="projects-page">
      <main className="shell-main projects-main">
        <div className="page-intro section-heading page-heading">
          <h1>projects</h1>
          <a href="/">back</a>
        </div>
        <ProjectList />
      </main>
    </SiteShell>
  );
}

function ProjectDetailPage({ project }) {
  return (
    <SiteShell className="detail-page">
      <main className="shell-main detail-main">
        <article className="project-detail">
          <header className="detail-header">
            <div className="detail-kicker">
              <span>{project.label}</span>
              <a href="/projects">all projects</a>
            </div>
            <h1>{project.title}</h1>
            <p>{project.summary}</p>
            <a className="outbound-link" href={project.outboundUrl} target="_blank" rel="noreferrer">
              visit project <span aria-hidden="true">↗</span>
            </a>
          </header>

          <figure className="project-cover">
            <img src={project.coverUrl} alt={project.coverAlt} />
            <figcaption>{project.creditLabel ?? 'Photo'}: <a href={project.creditUrl} target="_blank" rel="noreferrer">{project.creditName}</a>{project.creditSuffix ?? ' / Unsplash'}</figcaption>
          </figure>

          <div className="project-body">
            <dl className="project-meta">
              <div><dt>year</dt><dd>{project.year}</dd></div>
              <div><dt>status</dt><dd>{project.status}</dd></div>
              <div><dt>format</dt><dd>{project.format}</dd></div>
              <div><dt>with</dt><dd>{project.collaborators}</dd></div>
            </dl>
            <div className="project-writeup">
              {project.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>
        </article>
      </main>
    </SiteShell>
  );
}

function AboutPage() {
  return (
    <SiteShell className="about-page" current="about">
      <main className="shell-main about-main">
        <div className="about-mark"><Logo large /></div>
        <section aria-labelledby="about-title">
          <h1 id="about-title">self-driving jazz</h1>
          <p>We make autonomous media, functional fictions, and software with a point of view.</p>
          <div className="about-links">
            <a href="/projects">view projects</a>
            <a href="https://github.com/selfdrivingjazz" target="_blank" rel="noreferrer">github <span aria-hidden="true">↗</span></a>
            <a href="https://x.com/selfdrivingjazz" target="_blank" rel="noreferrer">x <span aria-hidden="true">↗</span></a>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}

function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/about') return <AboutPage />;
  if (path === '/machine') return <MachinePage />;
  if (path === '/projects') return <ProjectsPage />;
  const projectMatch = path.match(/^\/projects\/([^/]+)$/);
  if (projectMatch) {
    const project = PROJECTS.find(({ slug }) => slug === projectMatch[1]);
    if (project) return <ProjectDetailPage project={project} />;
  }
  return <HomePage />;
}

export default App;
