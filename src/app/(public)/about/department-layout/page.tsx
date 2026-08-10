import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getDepartmentLayouts, getOfficeLocations, getPageHero } from '@/lib/identity';
import { departmentMetadata } from '@/lib/page-metadata';
import DepartmentLayoutClient from './DepartmentLayoutClient';
import OfficeDirectory from './OfficeDirectory';

export async function generateMetadata() {
  return departmentMetadata({
    title: 'Layout Plan',
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
      title={hero?.heroTitle ?? 'Layout Plan'}
      overline={hero?.heroOverline ?? 'About'}
      image={hero?.heroImageUrl ?? '/assets/site-school-1024x576.webp'}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : undefined}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        {/* The directory first: someone on this page is usually looking for a
            level, and reads it here rather than downloading a file to find it.
            The plan below is the same information to take away. */}
        <OfficeDirectory offices={offices} />

        {mapped.length > 0 && (
          <div className="mt-14 md:mt-20">
            <h2 className="text-primary font-display mb-2 text-center text-xl font-bold md:text-2xl">
              Download the plan
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-center text-[15px] text-gray-600">
              The same directory as a printable document.
            </p>
            <DepartmentLayoutClient items={mapped} />
          </div>
        )}

        {mapped.length === 0 && offices.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">No department layout yet.</p>
          </div>
        )}
      </Container>
    </PageShell>
  );
}
