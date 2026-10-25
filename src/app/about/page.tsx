import { Logo } from '../../components/Header';
import SiteShell from '../../components/SiteShell';
import TrackedAnchor from '../../components/TrackedAnchor';
import { pageMetadata } from '../../lib/metadata';

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
            <TrackedAnchor href="https://github.com/selfdrivingjazz" target="_blank" rel="noreferrer" event={{ name: 'contact_open', channel: 'github' }}>github <span aria-hidden="true">↗</span></TrackedAnchor>
            <TrackedAnchor href="https://x.com/selfdrivingjazz" target="_blank" rel="noreferrer" event={{ name: 'contact_open', channel: 'x' }}>x <span aria-hidden="true">↗</span></TrackedAnchor>
            <TrackedAnchor href="https://selfdrivingjazz.substack.com" target="_blank" rel="noreferrer" event={{ name: 'contact_open', channel: 'substack' }}>substack <span aria-hidden="true">↗</span></TrackedAnchor>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
