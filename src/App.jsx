function VectorMachine() {
  return (
    <svg
      className="machine"
      viewBox="0 0 760 620"
      role="img"
      aria-labelledby="machine-title machine-description"
    >
      <title id="machine-title">An abstract musical machine</title>
      <desc id="machine-description">
        A restrained isometric assembly of connected decks, channels, and a rotating record.
      </desc>

      <defs>
        <linearGradient id="deck" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#26312e" />
          <stop offset="1" stopColor="#151b1a" />
        </linearGradient>
        <linearGradient id="signal" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#73ddd0" />
          <stop offset="1" stopColor="#b7d960" />
        </linearGradient>
        <filter id="soft-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      <g className="machine-grid" aria-hidden="true">
        <path d="M102 462 414 282 674 432 362 612Z" />
        <path d="M154 492 466 312M207 522 519 342M259 552 571 372M311 582 623 402" />
        <path d="M154 432 414 582M206 402 466 552M258 372 518 522M310 342 570 492M362 312 622 462" />
      </g>

      <g className="machine-shadow" aria-hidden="true">
        <ellipse cx="399" cy="510" rx="246" ry="72" />
      </g>

      <g className="machine-base">
        <path className="top" d="M120 419 386 266 657 422 390 576Z" />
        <path className="side" d="M120 419 390 576 390 604 120 448Z" />
        <path className="side side-right" d="M390 576 657 422 657 450 390 604Z" />
        <path className="base-rule" d="M160 446 390 578 618 446" />
      </g>

      <g className="module module-left">
        <path className="face" d="M166 395 300 318 403 377 269 455Z" />
        <path className="edge" d="M166 395 269 455 269 530 166 470Z" />
        <path className="edge edge-right" d="M269 455 403 377 403 452 269 530Z" />
        <path className="channel" d="M194 409 287 355 360 397 267 451Z" />
        <path className="channel-line" d="M211 418 303 365M233 431 325 378M255 444 347 391" />
      </g>

      <g className="module module-center">
        <path className="face" d="M304 292 446 210 563 278 421 360Z" />
        <path className="edge" d="M304 292 421 360 421 462 304 394Z" />
        <path className="edge edge-right" d="M421 360 563 278 563 380 421 462Z" />
        <path className="signal-pad" d="M339 310 422 262 488 300 405 348Z" />
      </g>

      <g className="turntable">
        <path className="face" d="M355 218 468 153 567 210 454 276Z" />
        <path className="edge" d="M355 218 454 276 454 325 355 267Z" />
        <path className="edge edge-right" d="M454 276 567 210 567 259 454 325Z" />
        <ellipse className="disc" cx="461" cy="213" rx="69" ry="41" transform="rotate(30 461 213)" />
        <ellipse className="disc-core" cx="461" cy="213" rx="24" ry="14" transform="rotate(30 461 213)" />
        <circle className="pin" cx="461" cy="213" r="5" />
      </g>

      <g className="rail">
        <path className="rail-body" d="M196 335 547 537 598 507 247 305Z" />
        <path className="rail-side" d="M547 537 598 507 598 532 547 562Z" />
        <path className="rail-signal" d="M242 326 558 509" />
        <circle cx="327" cy="381" r="7" />
        <circle cx="422" cy="436" r="7" />
        <circle cx="517" cy="491" r="7" />
      </g>

      <g className="steps">
        <path d="M251 283 285 264 314 281 280 301Z" />
        <path d="M274 262 308 243 337 260 303 280Z" />
        <path d="M297 241 331 222 360 239 326 259Z" />
      </g>

      <path className="cable" d="M526 411c53-30 102-23 113 14 10 33-19 57-55 58" />
      <circle className="jack" cx="581" cy="483" r="16" />
      <circle className="signal-glow" cx="553" cy="402" r="22" aria-hidden="true" />
      <circle className="signal-node" cx="553" cy="402" r="9" />

      <g className="machine-labels" aria-hidden="true">
        <text x="109" y="397">INPUT / 01</text>
        <text x="575" y="468">OUT</text>
        <text x="509" y="173">33⅓</text>
        <path d="M568 174h69M637 174v58" />
      </g>
    </svg>
  );
}

function App() {
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
            <VectorMachine />
            <figcaption>
              <span>Machine study 001</span>
              <span>Improvised systems / autonomous time</span>
            </figcaption>
          </figure>
        </section>
      </main>

      <footer className="site-footer">
        <span>Self-Driving Jazz</span>
        <span>Works forthcoming</span>
        <span>2026</span>
      </footer>
    </div>
  );
}

export default App;
