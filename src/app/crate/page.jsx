import CrateScrollExperience from '../../components/CrateScrollExperience';
import SiteShell from '../../components/SiteShell';
import { pageMetadata } from '../../lib/metadata';

export const metadata = pageMetadata({
  path: '/crate',
  description: 'A scroll-driven record crate prototype for the Self-Driving Jazz catalog.',
  socialTitle: 'The crate — Self-Driving Jazz',
  imageAlt: 'Self-Driving Jazz project records arranged in a crate.',
});

export default function CratePrototypePage() {
  return (
    <SiteShell className="crate-page">
      <CrateScrollExperience />
    </SiteShell>
  );
}
