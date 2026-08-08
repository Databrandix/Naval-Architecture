import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getFaqs, getPageHero } from '@/lib/identity';
import FAQList from './FAQList';

export const metadata = {
  title: 'FAQ — Department of Electrical and Electronics Engineering',
  description:
    'Frequently asked questions about admission, rankings, campus, programs, and exams at Sonargaon University.',
};

export default async function FAQPage() {
  const [faqs, hero] = await Promise.all([
    getFaqs(),
    getPageHero('student-society-faq'),
  ]);

  return (
    <PageShell
      title={hero?.heroTitle ?? 'Frequently Asked Questions'}
      subtitle={hero?.heroSubtitle ?? undefined}
      overline={hero?.heroOverline ?? 'Student Society'}
      image={hero?.heroImageUrl ?? '/assets/faq-hero.webp'}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : 'center 35%'}
      contentClassName="bg-gray-50 py-12 md:py-16"
    >
      <Container>
        <div className="mx-auto max-w-[1400px]">
          <FAQList
            faqs={faqs.map((f) => ({
              id:       f.id,
              category: f.category,
              question: f.question,
              answer:   f.answer,
            }))}
          />
        </div>
      </Container>
    </PageShell>
  );
}
