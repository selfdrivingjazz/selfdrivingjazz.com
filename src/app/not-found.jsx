import Link from 'next/link';
import SiteShell from '../components/SiteShell.jsx';

export const metadata = {
  title: 'self-driving jazz',
  robots: { index: false, follow: false },
};

export default function NotFoundPage() {
  return (
    <SiteShell className="projects-page">
      <main className="shell-main projects-main">
        <div className="page-intro section-heading page-heading">
          <h1>not found</h1>
          <Link href="/">home</Link>
        </div>
      </main>
    </SiteShell>
  );
}
