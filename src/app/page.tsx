import HomeExperience from '../components/HomeExperience';
import SiteShell from '../components/SiteShell';
import { pageMetadata } from '../lib/metadata';

export const metadata = pageMetadata({ path: '/' });

export default function HomePage() {
  return (
    <SiteShell className="home-page">
      <HomeExperience />
    </SiteShell>
  );
}
