import Image from 'next/image';
import Link from 'next/link';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getNews, getNewsCount, getNewsLanding } from '@/lib/identity';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { departmentMetadata } from '@/lib/page-metadata';

export async function generateMetadata() {
  return departmentMetadata({
    title: 'News',
    description:
      'Latest news from the {department}, Sonargaon University — events, workshops, industrial visits, and academic milestones.',
  });
}

const FALLBACK_HERO_IMAGE = '/assets/site-school-1024x576.webp';
const FALLBACK_HERO_TITLE = 'Latest News';
const FALLBACK_HERO_OVERLINE = 'News';
const FALLBACK_INTRO =
  'Stay updated with the recent breakthroughs, campus highlights, and academic achievements from the heart of our community.';

const PAGE_SIZE = 12;

function formatDate(d: Date, displayDate: string | null): string {
  if (displayDate) return displayDate;
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

type SearchParams = Promise<{ page?: string | string[] }>;

export default async function NewsListingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const rawPage = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const pageNum = Math.max(1, Number.parseInt(rawPage ?? '1', 10) || 1);
  const skip = (pageNum - 1) * PAGE_SIZE;

  const [items, total, landing] = await Promise.all([
    getNews({ skip, take: PAGE_SIZE }),
    getNewsCount(),
    getNewsLanding(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const heroImage = landing?.heroImageUrl || FALLBACK_HERO_IMAGE;
  const heroImagePosition = `center ${landing?.heroImageVerticalPercent ?? 50}%`;
  const heroTitle = landing?.heroTitle || FALLBACK_HERO_TITLE;
  const heroSubtitle = landing?.heroSubtitle ?? undefined;
  const heroOverline = landing?.heroOverline ?? FALLBACK_HERO_OVERLINE;
  const introBody = landing?.introBody ?? FALLBACK_INTRO;

  return (
    <PageShell
      title={heroTitle}
      subtitle={heroSubtitle}
      overline={heroOverline}
      image={heroImage}
      imagePosition={heroImagePosition}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        {introBody && (
          <div className="max-w-3xl mx-auto text-center mb-10 md:mb-12">
            <p
              className="text-base md:text-lg text-gray-700 leading-[1.85]"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(introBody) }}
            />
          </div>
        )}

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">No news articles yet.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Link
                  key={item.slug}
                  href={`/news/${item.slug}`}
                  className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    <Image
                      src={item.coverUrl}
                      alt={item.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-emerald-600 text-xs font-semibold">{item.category}</span>
                    </div>
                    <h3 className="font-display text-base md:text-lg font-bold text-primary leading-snug mb-2 group-hover:text-accent transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">
                      {item.summary}
                    </p>
                    <div className="mt-auto pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                      <Calendar size={13} className="text-accent" />
                      {formatDate(item.publishedAt, item.displayDate)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <nav
                aria-label="News pagination"
                className="mt-10 md:mt-14 flex items-center justify-center gap-2"
              >
                {pageNum > 1 ? (
                  <Link
                    href={pageNum === 2 ? '/news' : `/news?page=${pageNum - 1}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-accent hover:text-accent transition-colors"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 text-sm text-gray-400 cursor-not-allowed">
                    <ChevronLeft size={16} />
                    Previous
                  </span>
                )}
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page <span className="font-semibold text-primary">{pageNum}</span> of <span className="font-semibold text-primary">{totalPages}</span>
                </span>
                {pageNum < totalPages ? (
                  <Link
                    href={`/news?page=${pageNum + 1}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:border-accent hover:text-accent transition-colors"
                  >
                    Next
                    <ChevronRight size={16} />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 text-sm text-gray-400 cursor-not-allowed">
                    Next
                    <ChevronRight size={16} />
                  </span>
                )}
              </nav>
            )}
          </>
        )}
      </Container>
    </PageShell>
  );
}
