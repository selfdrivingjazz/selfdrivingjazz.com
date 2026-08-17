import HomeExperience from '../components/HomeExperience.jsx';
import SiteShell from '../components/SiteShell.jsx';
import { homeProjectIndex } from '../data/homeProjects.js';
import { pageMetadata } from '../lib/metadata.js';

export const metadata = pageMetadata({ path: '/' });

export default async function HomePage({ searchParams }) {
  const query = await searchParams;
  const returnSlug = typeof query?.return === 'string' ? query.return : null;

  return (
    <SiteShell className="home-page">
      <HomeExperience initialProjectIndex={homeProjectIndex(returnSlug)} />
    </SiteShell>
  );
}
