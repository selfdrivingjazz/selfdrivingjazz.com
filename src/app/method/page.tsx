import CrateScrollExperience from '../../components/CrateScrollExperience';
import SiteShell from '../../components/SiteShell';
import { pageMetadata } from '../../lib/metadata';

export const metadata = pageMetadata({
  path: '/method',
  description: 'A page-by-page record crate for the Self-Driving Jazz method.',
  socialTitle: 'The method — Self-Driving Jazz',
  imageAlt: 'Self-Driving Jazz projects arranged in a record crate.',
});

export default function MethodPage() {
  return (
    <SiteShell className="crate-page">
      <CrateScrollExperience />
    </SiteShell>
  );
}
