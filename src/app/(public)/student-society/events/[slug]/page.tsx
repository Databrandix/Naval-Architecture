import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Tag,
  Calendar,
  Clock,
  MapPin,
  Target,
  ArrowLeft,
  ArrowRight,
  Building2,
  GraduationCap,
} from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getDepartmentIdentity, getEventBySlug, getEventSlugs } from '@/lib/identity';

export async function generateStaticParams() {
  const slugs = await getEventSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ev = await getEventBySlug(slug);
  if (!ev) return { title: 'Event not found' };
  /* The root layout's template already appends the university and department,
     so the event name alone is the title. */
  return { title: ev.shortTitle, description: ev.summary };
}

const CATEGORY_STYLES: Record<string, string> = {
  Sports: 'bg-emerald-100 text-emerald-700',
  'Industrial Visit': 'bg-amber-100 text-amber-700',
  Achievement: 'bg-violet-100 text-violet-700',
  Partnership: 'bg-sky-100 text-sky-700',
  Seminar: 'bg-rose-100 text-rose-700',
  Exhibition: 'bg-primary/10 text-primary',
};

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

function formatDate(d: Date | null, displayDate: string | null): string | null {
  if (displayDate) return displayDate;
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [ev, dept] = await Promise.all([getEventBySlug(slug), getDepartmentIdentity()]);
  if (!ev) notFound();

  const description = coerceParagraphs(ev.description);
  const details = coerceKeyValueList(ev.details);
  const dateLabel = formatDate(ev.eventDate, ev.displayDate);
  const catStyle = CATEGORY_STYLES[ev.category] ?? 'bg-gray-100 text-gray-700';

  return (
    <PageShell title={ev.shortTitle} overline="Events" contentClassName="bg-gray-50 py-12 md:py-20">
      <Container>
        {/* Back link */}
        <Link
          href="/student-society/events"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-accent transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to all events
        </Link>

        {/* Two-column: main + sidebar */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* Main column — cover + title + short description */}
          <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-hidden bg-gray-100">
              <Image
                src={ev.imageUrl}
                alt={ev.shortTitle}
                width={1200}
                height={750}
                sizes="(min-width: 1280px) 800px, 100vw"
                priority
                className="block w-full h-auto"
              />
            </div>
            <div className="p-6 md:p-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-primary leading-tight mb-3">
                {ev.shortTitle}
              </h2>
              <p className="text-[15px] md:text-base text-gray-700 leading-relaxed">
                {ev.summary}
              </p>
            </div>
          </article>

          {/* Sidebar — Event Details */}
          <aside className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-7 h-fit lg:sticky lg:top-32">
            <h3 className="font-display text-xl font-bold text-primary mb-5">Event Details</h3>

            <div className="space-y-5">
              <DetailRow
                Icon={Building2}
                label="Department"
                value={dept.name.replace(/^Department of\s+/i, '')}
              />
              {dateLabel && <DetailRow Icon={Calendar} label="Date" value={dateLabel} />}
              {ev.time && <DetailRow Icon={Clock} label="Time" value={ev.time} />}
              {ev.venue && <DetailRow Icon={MapPin} label="Venue" value={ev.venue} />}

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 mt-0.5 text-gray-400 shrink-0">
                  <Tag size={20} />
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Category</div>
                  <span
                    className={`inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${catStyle}`}
                  >
                    {ev.category}
                  </span>
                </div>
              </div>

              <DetailRow
                Icon={GraduationCap}
                label="Faculty"
                value={dept.facultyName}
              />
            </div>
          </aside>
        </div>

        {/* Full description + extras (below two-column) */}
        {(description.length > 0 || ev.focus || details.length > 0 || (ev.ctaLabel && ev.ctaHref)) && (
          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
            {description.length > 0 && (
              <div className="space-y-4 text-[16px] leading-[1.85] text-gray-800">
                {description.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}

            {ev.focus && (
              <div className="mt-8 flex items-start gap-4 p-5 bg-accent/5 border-l-4 border-accent rounded-r-lg">
                <Target size={22} className="text-accent shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] font-bold tracking-[0.25em] uppercase text-accent mb-1">
                    Focus
                  </div>
                  <p className="text-[15px] text-gray-800 leading-relaxed">{ev.focus}</p>
                </div>
              </div>
            )}

            {details.length > 0 && (
              <div className="mt-8 bg-gray-50 rounded-xl p-6">
                <h3 className="font-display text-lg font-bold text-primary mb-4">
                  Additional Information
                </h3>
                <dl className="grid sm:grid-cols-[200px_1fr] gap-x-6 gap-y-3 text-[14px]">
                  {details.map(({ label, value }) => (
                    <div key={label} className="contents">
                      <dt className="font-semibold text-primary">{label}</dt>
                      <dd className="text-gray-700">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {ev.ctaLabel && ev.ctaHref && (
              <div className="mt-8">
                <a
                  href={ev.ctaHref}
                  {...(ev.ctaExternal && { target: '_blank', rel: 'noopener noreferrer' })}
                  className="inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-md shadow-md hover:brightness-110 hover:-translate-y-0.5 transition-all"
                >
                  {ev.ctaLabel}
                  <ArrowRight size={16} />
                </a>
              </div>
            )}
          </div>
        )}
      </Container>
    </PageShell>
  );
}

function DetailRow({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-5 h-5 mt-0.5 text-gray-400 shrink-0">
        <Icon size={20} />
      </div>
      <div>
        <div className="text-xs text-gray-500 mb-0.5">{label}</div>
        <div className="text-[15px] font-semibold text-gray-800">{value}</div>
      </div>
    </div>
  );
}
