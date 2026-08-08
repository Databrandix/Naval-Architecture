import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, Tag, ArrowRight, ChevronRight, Home } from 'lucide-react';
import Container from '@/components/ui/Container';
import { prisma } from '@/lib/db';
import { getNewsBySlug, getNewsSlugs } from '@/lib/identity';

export async function generateStaticParams() {
  const slugs = await getNewsSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);
  if (!article) return { title: 'News article not found' };
  /* The root layout's template already appends the university and department,
     so the headline alone is the title. */
  return { title: article.shortTitle, description: article.summary };
}

// Defensive Json reads — the body / meta columns are typed `Json`
// in Prisma; runtime shapes match Phase 6 admin form output but a
// hand-edited row could deviate. Coerce on read so the renderer
// never crashes on a malformed column.
function coerceParagraphs(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((p): p is string => typeof p === 'string' && p.length > 0);
}

function coerceKeyValueList(v: unknown): { label: string; value: string }[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r): r is { label?: unknown; value?: unknown } => typeof r === 'object' && r !== null)
    .map((r) => ({
      label: typeof r.label === 'string' ? r.label : '',
      value: typeof r.value === 'string' ? r.value : '',
    }))
    .filter((r) => r.label && r.value);
}

function formatDate(d: Date, displayDate: string | null): string {
  if (displayDate) return displayDate;
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);
  if (!article) notFound();

  // Related news — top 3 newest excluding the current article.
  // Lives outside the cache() wrappers because the slug filter is
  // per-page; a small uncached query is fine.
  const related = await prisma.news.findMany({
    where: { slug: { not: slug } },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    select: { slug: true, shortTitle: true, category: true, coverUrl: true },
  });

  const paragraphs = coerceParagraphs(article.body);
  const metaRows = coerceKeyValueList(article.meta);
  const dateLabel = formatDate(article.publishedAt, article.displayDate);

  return (
    <main className="bg-gray-50">
      {/* Top spacer for fixed navbar (top bar 40px + middle ~80px + bottom 56px ≈ 176px) */}
      <div className="pt-[180px] md:pt-[200px] pb-12 md:pb-20">
        <Container>
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-sm text-gray-500 mb-6"
          >
            <Link href="/" className="inline-flex items-center gap-1 hover:text-accent transition-colors">
              <Home size={13} />
              Home
            </Link>
            <ChevronRight size={13} className="opacity-60" />
            <Link href="/news" className="hover:text-accent transition-colors">
              News
            </Link>
            <ChevronRight size={13} className="opacity-60" />
            <span className="text-primary font-medium line-clamp-1">{article.shortTitle}</span>
          </nav>

          {/* Title */}
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary leading-tight mb-6">
            {article.title}
          </h1>

          {/* Cover image with badges overlay */}
          <div className="relative rounded-2xl overflow-hidden bg-gray-100 mb-8 md:mb-10">
            <Image
              src={article.coverUrl}
              alt={article.shortTitle}
              width={1200}
              height={750}
              sizes="(min-width: 1280px) 1200px, 100vw"
              priority
              className="w-full h-auto"
            />
            <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-button-yellow text-primary text-xs font-bold tracking-wider uppercase shadow-md">
                <Tag size={12} />
                {article.category}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-button-yellow text-primary text-xs font-bold shadow-md">
                <Calendar size={12} />
                {dateLabel}
              </span>
            </div>
          </div>

          {/* Body */}
          {paragraphs.length > 0 && (
            <article className="space-y-5 text-[16px] md:text-[17px] leading-[1.85] text-gray-800 mb-12 md:mb-16">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </article>
          )}

          {/* Meta details */}
          {metaRows.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-7 mb-12 md:mb-16">
              <h3 className="font-display text-lg font-bold text-primary mb-4">
                Event Details
              </h3>
              <dl className="grid sm:grid-cols-[180px_1fr] gap-x-6 gap-y-3 text-[14px]">
                {metaRows.map(({ label, value }) => (
                  <div key={label} className="contents">
                    <dt className="font-semibold text-primary">{label}</dt>
                    <dd className="text-gray-700">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Related stories — yellow CTA card + 3 related */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {/* Explore yellow card */}
            <Link
              href="/news"
              className="bg-button-yellow rounded-2xl p-6 md:p-7 flex flex-col justify-between min-h-[200px] hover:brightness-105 transition-all group"
            >
              <h3 className="font-display text-xl md:text-2xl font-bold text-primary leading-tight">
                Explore the Inspiring Stories and Events of SU Campus
              </h3>
              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-primary text-sm font-bold rounded-md shadow-sm w-fit mt-5 group-hover:bg-primary group-hover:text-white transition-colors">
                More News
                <ArrowRight size={14} />
              </span>
            </Link>

            {/* 3 related news cards */}
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`/news/${item.slug}`}
                className="relative rounded-2xl overflow-hidden min-h-[200px] group bg-gray-200"
              >
                <Image
                  src={item.coverUrl}
                  alt={item.shortTitle}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent" />
                <div className="absolute inset-0 p-5 flex flex-col justify-end">
                  <span className="inline-block w-fit px-2.5 py-0.5 bg-button-yellow text-primary text-[10px] font-bold tracking-wider uppercase rounded-md mb-2">
                    {item.category}
                  </span>
                  <h4 className="font-display text-sm md:text-base font-bold text-white leading-snug line-clamp-3">
                    {item.shortTitle}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </div>
    </main>
  );
}
