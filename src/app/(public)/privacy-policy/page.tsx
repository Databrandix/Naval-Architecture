import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import LegalSections from '@/components/sections/LegalSections';
import { getLegalPagesContent } from '@/lib/identity';

export const metadata = {
  title: 'Privacy Policy — Sonargaon University',
  description:
    'Privacy Policy for the Department of Electrical and Electronics Engineering, Sonargaon University — how we handle visitor information and respect your consent.',
};

export default async function PrivacyPolicyPage() {
  const row = await getLegalPagesContent();
  if (!row) {
    throw new Error(
      'LegalPagesContent row missing (id="singleton"). Run `npm run db:seed`.',
    );
  }

  return (
    <PageShell
      title={row.privacyHeroTitle}
      overline={row.privacyHeroOverline ?? undefined}
      image={row.privacyHeroImageUrl}
      imagePosition={`center ${row.privacyHeroImageVerticalPercent}%`}
      contentClassName="bg-gray-50 py-12 md:py-16"
    >
      <Container>
        <LegalSections sections={row.privacySections} />
      </Container>
    </PageShell>
  );
}
