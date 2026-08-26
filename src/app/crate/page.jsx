import CrateScrollExperience from '../../components/CrateScrollExperience';
import SiteShell from '../../components/SiteShell';
import { pageMetadata } from '../../lib/metadata';

export const metadata = pageMetadata({
  path: '/crate',
  description: 'A page-by-page record crate prototype for the Self-Driving Jazz catalog.',
  socialTitle: 'The crate — Self-Driving Jazz',
  imageAlt: 'Self-Driving Jazz projects arranged in a record crate.',
});

export default function CratePrototypePage() {
  return (
    <SiteShell className="crate-page">
      <CrateScrollExperience />
    </SiteShell>
  );
}
