import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getAboutOverview } from '@/lib/identity';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { departmentMetadata } from '@/lib/page-metadata';

export async function generateMetadata() {
  return departmentMetadata({
    title: 'Overview',
    description:
      'Overview of the Department of Mechanical Engineering — programs, vision, and the scope of mechanical engineering as a discipline and a career.',
  });
}

export default async function OverviewPage() {
  const row = await getAboutOverview();
  if (!row) {
    throw new Error(
      'AboutOverview row missing (id="singleton"). Run `npm run db:seed`.',
    );
  }

  return (
    <PageShell
      title={row.heroTitle}
      subtitle={row.heroSubtitle ?? undefined}
      overline={row.heroOverline ?? undefined}
      image={row.heroImageUrl}
      imagePosition={`center ${row.heroImageVerticalPercent}%`}
    >
      <Container>
        <div className="space-y-6 text-[16px] md:text-[17px] leading-[1.85] text-gray-800 text-justify">
          {row.paragraphs.map((p, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: sanitizeHtml(p) }} />
          ))}
        </div>
      </Container>
    </PageShell>
  );
}
