import { lazy, Suspense } from 'react';

const MachineCanvas = lazy(() => import('./MachineCanvas.jsx'));

const PROJECTS = ['project 001', 'project 002', 'project 003'];

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

function MenuLink() {
  return (
    <a className="menu-link" href="/about" aria-label="About">
      <span />
      <span />
    </a>
  );
}

function Header() {
  return (
    <header className="header">
      <a href="/" aria-label="Self-Driving Jazz home"><Logo /></a>
      <MenuLink />
    </header>
  );
}

function ProjectList({ includeMore = false }) {
  return (
    <ol className="project-list">
      {PROJECTS.map((project, index) => (
        <li key={project}>
          <span>{project}</span>
          <span>{String(index + 1).padStart(2, '0')}</span>
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
  return (
    <div className="page home-page">
      <Header />
      <main className="home-main">
        <section className="identity" aria-labelledby="home-title">
          <h1 id="home-title">self-driving jazz</h1>
          <p>an autonomous media empire</p>
        </section>

        <section className="recent" aria-label="projects">
          <ProjectList includeMore />
        </section>

        <div className="home-machine" aria-label="Evolving procedural machine">
          <Suspense fallback={null}>
            <MachineCanvas seed={HOME_MACHINE_SEED} evolution />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

function ProjectsPage() {
  return (
    <div className="page interior-page">
      <Header />
      <main className="projects-main">
        <div className="section-heading page-heading">
          <h1>projects</h1>
          <a href="/">back</a>
        </div>
        <ProjectList />
      </main>
    </div>
  );
}

function AboutPage() {
  return (
    <main className="about-page">
      <a href="/" aria-label="Back to Self-Driving Jazz">
        <Logo large />
      </a>
    </main>
  );
}

function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/about') return <AboutPage />;
  if (path === '/projects') return <ProjectsPage />;
  return <HomePage />;
}

export default App;
