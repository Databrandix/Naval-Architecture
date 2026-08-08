import { Calendar, MapPin, Users, FileText, ExternalLink } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getResearchPapers, getPageHero } from '@/lib/identity';

export const metadata = {
  title: 'Research — Department of Electrical and Electronics Engineering',
  description:
    'Published research papers from the Department of Electrical and Electronics Engineering, Sonargaon University.',
};

export default async function ResearchPage() {
  const [papers, hero] = await Promise.all([
    getResearchPapers(),
    getPageHero('research'),
  ]);

  return (
    <PageShell
      title={hero?.heroTitle ?? 'Research Publications'}
      subtitle={hero?.heroSubtitle ?? undefined}
      overline={hero?.heroOverline ?? 'Academic Excellence'}
      image={hero?.heroImageUrl ?? undefined}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : undefined}
      contentClassName="bg-gray-50 py-12 md:py-16"
    >
      <Container>
        <div className="mx-auto max-w-3xl text-center mb-10 md:mb-14">
          <p className="text-[15px] md:text-[16px] leading-[1.85] text-gray-700">
            A selection of research publications by faculty and students of the
            Department of Electrical and Electronics Engineering, Sonargaon University, spanning
            VLSI design, signal processing, renewable energy, communication systems,
            and more.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-primary bg-primary/5 px-4 py-1.5 rounded-full">
            <FileText size={14} />
            {papers.length} Publications
          </p>
        </div>

        {papers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">No research papers yet.</p>
          </div>
        ) : (
          <div className="mx-auto max-w-6xl grid gap-5 md:gap-6 lg:grid-cols-2">
            {papers.map((paper, idx) => (
              <article
                key={paper.id}
                className="flex gap-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-shadow p-5 md:p-6"
              >
                <div className="shrink-0">
                  <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center font-display font-bold text-[15px]">
                    {idx + 1}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] md:text-[16px] font-bold leading-snug text-primary mb-3">
                    {paper.title}
                  </h3>

                  <div className="flex flex-wrap gap-x-5 gap-y-2 mb-3 text-[12.5px]">
                    {paper.date && (
                      <span className="inline-flex items-center gap-1.5 text-gray-600">
                        <Calendar size={13} className="text-accent" />
                        {paper.date}
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-2 mb-2 text-[13px] leading-[1.6]">
                    <Users size={13} className="shrink-0 mt-1 text-accent" />
                    <span className="text-gray-700 font-medium">{paper.authors}</span>
                  </div>

                  <div className="flex items-start gap-2 text-[12.5px] leading-[1.6]">
                    <MapPin size={13} className="shrink-0 mt-1 text-gray-400" />
                    <span className="text-gray-500">{paper.area}</span>
                  </div>

                  {Array.isArray(paper.links) && paper.links.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                      {paper.links.filter((l: any) => l?.label && l?.value).map((link: any, i: number) => (
                        <a
                          key={i}
                          href={link.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent bg-accent/5 hover:bg-accent/10 px-2.5 py-1 rounded-full transition-colors"
                        >
                          <ExternalLink size={11} />
                          {link.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>
    </PageShell>
  );
}
