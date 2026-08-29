import CrateExperience from '../../components/CrateExperience';
import SiteShell from '../../components/SiteShell';
import { pageMetadata } from '../../lib/metadata';

export const metadata = pageMetadata({
  path: '/method',
  description: 'The Self-Driving Jazz method for making projects and experiments.',
  socialTitle: 'The method — Self-Driving Jazz',
  imageAlt: 'Self-Driving Jazz projects arranged as a living catalogue.',
});

export default function MethodPage() {
  return (
    <SiteShell className="crate-page">
      <CrateExperience />
    </SiteShell>
  );
}
