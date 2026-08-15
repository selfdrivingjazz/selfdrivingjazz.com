import HomeExperience from '../components/HomeExperience.jsx';
import SiteShell from '../components/SiteShell.jsx';
import { pageMetadata } from '../lib/metadata.js';

export const metadata = pageMetadata({ path: '/' });

export default function HomePage() {
  return (
    <SiteShell className="home-page">
      <HomeExperience />
    </SiteShell>
  );
}
