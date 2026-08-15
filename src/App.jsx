import { lazy, Suspense, useState } from 'react';

const MachineCanvas = lazy(() => import('./MachineCanvas.jsx'));

const INITIAL_SEED = 0x5d4a7e11;

function nextSeed(seed) {
  let value = seed ^ (seed << 13);
  value ^= value >>> 17;
  value ^= value << 5;
  return value >>> 0;
}

function specimenCode(seed) {
  return seed.toString(16).padStart(8, '0').slice(-8).toUpperCase();
}

function App() {
  const [seed, setSeed] = useState(INITIAL_SEED);
  const code = specimenCode(seed);

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="mark" href="#top" aria-label="Self-Driving Jazz home">
          SDJ<span aria-hidden="true">/</span>
        </a>
        <p className="header-description">Independent human–machine studio</p>
        <a className="header-link" href="#about">About</a>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="page-title">
          <div className="hero-copy">
            <p className="eyebrow">Self-directed work · New York / Everywhere</p>
            <h1 id="page-title">
              Self-Driving
              <span>Jazz</span>
            </h1>
            <div id="about" className="introduction">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua.
              </p>
            </div>
            <div className="status">
              <span className="status-light" aria-hidden="true" />
              <span>Works catalogue in progress</span>
            </div>
          </div>

          <figure className="machine-figure">
            <Suspense fallback={<p className="machine-fallback">Assembling machine…</p>}>
              <MachineCanvas seed={seed} />
            </Suspense>
            <figcaption>
              <span className="specimen-code" aria-live="polite">Machine / {code}</span>
              <button type="button" onClick={() => setSeed((current) => nextSeed(current))}>
                Build another
                <span aria-hidden="true">↗</span>
              </button>
            </figcaption>
          </figure>
        </section>
      </main>

      <footer className="site-footer">
        <span>Self-Driving Jazz</span>
        <span>Procedural machine studies</span>
        <span>2026</span>
      </footer>
    </div>
  );
}

export default App;
