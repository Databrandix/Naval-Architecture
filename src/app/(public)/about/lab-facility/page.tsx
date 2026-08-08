import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getLabFacilityLanding, getLabs } from '@/lib/identity';
import { sanitizeHtml } from '@/lib/sanitize-html';
import LabFacilityClient from './LabFacilityClient';
import { departmentMetadata } from '@/lib/page-metadata';

export async function generateMetadata() {
  return departmentMetadata({
    title: 'Lab Facilities',
    description:
      'Departmental laboratories at Sonargaon University ME — manufacturing, ICE, applied mechanics, fluid mechanics, CFD, material testing, and more.',
  });
}

export default async function LabFacilityPage() {
  const [landing, labs] = await Promise.all([
    getLabFacilityLanding(),
    getLabs(),
  ]);
  if (!landing) {
    throw new Error(
      'LabFacilityLanding row missing (id="singleton"). Run `npm run db:seed`.',
    );
  }

  return (
    <PageShell
      title={landing.heroTitle}
      overline={landing.heroOverline ?? undefined}
      image={landing.heroImageUrl}
      imagePosition={`center ${landing.heroImageVerticalPercent}%`}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      {/* Intro */}
      <Container>
        <div className="max-w-3xl mx-auto text-center mb-10 md:mb-14">
          <p
            className="text-base md:text-lg text-gray-700 leading-[1.85]"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(landing.introBody) }}
          />
        </div>
      </Container>

      {/* Selected-lab detail UX — client component owns state + URL-hash */}
      <LabFacilityClient labs={labs} />
    </PageShell>
  );
}
