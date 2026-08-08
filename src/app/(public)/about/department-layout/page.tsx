import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getDepartmentLayouts, getPageHero } from '@/lib/identity';
import DepartmentLayoutClient from './DepartmentLayoutClient';

export const metadata = {
  title: 'Department Layout — Department of Electrical and Electronics Engineering',
  description: 'Department layout and floor plans for Electrical and Electronics Engineering at Sonargaon University.',
};

export default async function DepartmentLayoutPage() {
  const [items, hero] = await Promise.all([
    getDepartmentLayouts(),
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
        {mapped.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">No department layouts yet.</p>
          </div>
        ) : (
          <DepartmentLayoutClient items={mapped} />
        )}
      </Container>
    </PageShell>
  );
}
