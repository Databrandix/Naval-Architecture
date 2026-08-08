import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getSyllabi, getPageHero } from '@/lib/identity';
import SyllabusClient from './SyllabusClient';

export const metadata = {
  title: 'Syllabus — Department of Electrical and Electronics Engineering',
  description:
    'Course-by-course syllabus for the Department of Electrical and Electronics Engineering, Sonargaon University.',
};

export default async function SyllabusPage() {
  const [items, hero] = await Promise.all([
    getSyllabi(),
    getPageHero('student-society-syllabus'),
  ]);

  return (
    <PageShell
      title={hero?.heroTitle ?? 'Syllabus'}
      subtitle={hero?.heroSubtitle ?? undefined}
      overline={hero?.heroOverline ?? 'Student'}
      image={hero?.heroImageUrl ?? '/assets/syllabus-hero.webp'}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : undefined}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        <div className="max-w-3xl mx-auto text-center mb-10 md:mb-12">
          <p className="text-base md:text-lg text-gray-700 leading-[1.85]">
            Course-by-course syllabus for the Department of Electrical and Electronics Engineering. Download the official PDF for detailed credit distribution, course outcomes, and reference materials.
          </p>
        </div>

        <SyllabusClient
          items={items.map((s) => ({
            slug:       s.slug,
            title:      s.title,
            shortTitle: s.shortTitle,
            department: s.department,
            level:      s.level,
            coverUrl:   s.coverUrl,
            pdfUrl:     s.pdfUrl,
            summary:    s.summary,
          }))}
        />
      </Container>
    </PageShell>
  );
}
