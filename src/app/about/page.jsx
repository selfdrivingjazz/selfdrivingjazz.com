import { Logo } from '../../components/Header.jsx';
import SiteShell from '../../components/SiteShell.jsx';
import { pageMetadata } from '../../lib/metadata.js';

export const metadata = pageMetadata({
  path: '/about',
  description: 'self-driving jazz makes experiments in recursive media.',
});

export default function AboutPage() {
  return (
    <SiteShell className="about-page">
      <main className="shell-main about-main">
        <div className="about-mark"><Logo large /></div>
        <section aria-labelledby="about-title">
          <h1 id="about-title">self-driving jazz</h1>
          <p>experiments in recursive media.</p>
          <div className="about-links">
            <a href="https://github.com/selfdrivingjazz" target="_blank" rel="noreferrer">github <span aria-hidden="true">↗</span></a>
            <a href="https://x.com/selfdrivingjazz" target="_blank" rel="noreferrer">x <span aria-hidden="true">↗</span></a>
            <a href="https://selfdrivingjazz.substack.com" target="_blank" rel="noreferrer">substack <span aria-hidden="true">↗</span></a>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
