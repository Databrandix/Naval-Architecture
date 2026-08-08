import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getDepartmentLayouts, getOfficeLocations, getPageHero } from '@/lib/identity';
import { departmentMetadata } from '@/lib/page-metadata';
import DepartmentLayoutClient from './DepartmentLayoutClient';
import OfficeDirectory from './OfficeDirectory';

export async function generateMetadata() {
  return departmentMetadata({
    title: 'Department Layout',
    description: 'Where each office of the {department} and Sonargaon University sits in the building.',
  });
}

export default async function DepartmentLayoutPage() {
  const [items, offices, hero] = await Promise.all([
    getDepartmentLayouts(),
    getOfficeLocations(),
    getPageHero('department-layout'),
  ]);

  const mapped = items.map((i) => ({
    slug: i.slug,
    title: i.title,
    shortTitle: i.shortTitle,
    cover: i.coverUrl,
    pdf: i.pdfUrl ?? '',
  }));

  return (
    <PageShell
      title={hero?.heroTitle ?? 'Department Layout'}
      overline={hero?.heroOverline ?? 'About'}
      image={hero?.heroImageUrl ?? '/assets/site-school-1024x576.webp'}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : undefined}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        {/* Floor plans and other layout documents, when there are any. The
            directory below is the part the university actually supplies. */}
        {mapped.length > 0 && (
          <div className="mb-14 md:mb-20">
            <DepartmentLayoutClient items={mapped} />
          </div>
        )}

        <OfficeDirectory offices={offices} />

        {mapped.length === 0 && offices.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">No department layout yet.</p>
          </div>
        )}
      </Container>
    </PageShell>
  );
}
