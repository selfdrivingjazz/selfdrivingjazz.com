import { lazy, Suspense } from 'react';

const MachineCanvas = lazy(() => import('./MachineCanvas.jsx'));

const PROJECTS = ['Project 001', 'Project 002', 'Project 003'];
const HOME_MACHINE_SEED = 0x4f13246a;

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

function ProjectList() {
  return (
    <ol className="project-list">
      {PROJECTS.map((project, index) => (
        <li key={project}>
          <span>{project}</span>
          <span>{String(index + 1).padStart(2, '0')}</span>
        </li>
      ))}
    </ol>
  );
}

function HomePage() {
  return (
    <div className="page home-page">
      <Header />
      <main className="home-main">
        <section className="identity" aria-labelledby="home-title">
          <h1 id="home-title">Self-Driving Jazz</h1>
          <p>Autonomous media empire.</p>
        </section>

        <section className="recent" aria-labelledby="recent-title">
          <div className="section-heading">
            <h2 id="recent-title">Recent projects</h2>
            <a href="/projects">More</a>
          </div>
          <ProjectList />
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
          <h1>Projects</h1>
          <a href="/">Back</a>
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
