import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import type { Faculty } from '@prisma/client';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getFacultyList, getPageHero } from '@/lib/identity';
import { departmentMetadata } from '@/lib/page-metadata';

export async function generateMetadata() {
  return departmentMetadata({
    title: 'Faculty Members',
    description:
      'Faculty members of the {department}, Sonargaon University — Dean, Head of Department, full-time and part-time faculty.',
  });
}

const initialsOf = (name: string) =>
  name
    .replace(/[A-Z]\.\s|Md\.\s|Mrs?\.\s|Prof\.\s|Dr\.\s/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

export default async function FacultyMemberPage() {
  const [all, hero] = await Promise.all([
    getFacultyList(),
    getPageHero('faculty-member'),
  ]);
  const leaders  = all.filter((f) => f.type === 'leadership');
  const fullTime = all.filter((f) => f.type === 'full_time');
  const partTime = all.filter((f) => f.type === 'part_time');

  return (
    <PageShell
      title={hero?.heroTitle ?? 'Faculty Members'}
      subtitle={hero?.heroSubtitle ?? undefined}
      overline={hero?.heroOverline ?? 'Department'}
      image={hero?.heroImageUrl ?? '/assets/faculty-hero.webp'}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : 'top'}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        {/* Leadership */}
        <section className="mb-16 md:mb-20">
          <SectionHeading overline="Department Leadership" title="Leadership" />

          <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto">
            {leaders.map((leader) => (
              <article
                key={leader.id}
                className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="grid md:grid-cols-[220px_1fr] gap-6 md:gap-8 items-center p-6 md:p-8">
                  <div className="flex justify-center md:justify-start">
                    <div className="relative w-48 h-48 md:w-52 md:h-52 rounded-lg overflow-hidden bg-gray-50 border-2 border-gray-100 flex items-center justify-center">
                      {leader.photoUrl ? (
                        <Image
                          src={leader.photoUrl}
                          alt={leader.name}
                          fill
                          sizes="(min-width: 768px) 208px, 192px"
                          className="object-contain"
                        />
                      ) : (
                        <span className="font-display text-4xl font-bold text-accent/40">
                          {initialsOf(leader.name)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-center md:text-left">
                    {leader.badge && (
                      <span className="inline-block text-accent text-[11px] font-bold tracking-[0.2em] uppercase mb-2">
                        {leader.badge}
                      </span>
                    )}
                    <h3 className="font-display text-xl md:text-2xl font-bold text-primary leading-tight mb-2">
                      <a
                        href={`/faculty-member/${leader.slug}`}
                        className="hover:text-accent transition-colors"
                      >
                        {leader.name}
                      </a>
                    </h3>
                    <p className="text-gray-700 text-sm md:text-base">{leader.designation}</p>
                    {leader.secondaryTitle && (
                      <p className="text-gray-500 text-sm mt-1">{leader.secondaryTitle}</p>
                    )}

                    <div className="mt-5">
                      <a
                        href={`/faculty-member/${leader.slug}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors"
                      >
                        View Profile
                        <ArrowRight size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Full-time faculty */}
        <FacultySection
          overline="Our Teachers"
          title="Faculty Members"
          members={fullTime}
        />

        {/* Part-time faculty */}
        <div className="mt-16 md:mt-20">
          <FacultySection
            overline="Visiting & Contractual Faculty"
            title="Part-Time Teachers"
            members={partTime}
          />
        </div>
      </Container>
    </PageShell>
  );
}

function SectionHeading({ overline, title }: { overline: string; title: string }) {
  return (
    <div className="max-w-2xl mx-auto text-center mb-10 md:mb-12">
      <span className="inline-block text-accent text-[11px] font-bold tracking-[0.3em] uppercase mb-2">
        {overline}
      </span>
      <h2 className="font-display text-3xl md:text-4xl font-bold text-primary leading-tight">
        {title}
      </h2>
      <div className="mt-3 mx-auto h-1 w-16 bg-accent rounded-full" />
    </div>
  );
}

function FacultySection({
  overline,
  title,
  members,
}: {
  overline: string;
  title: string;
  members: Faculty[];
}) {
  return (
    <section>
      <SectionHeading overline={overline} title={title} />

      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {members.map((member) => (
          <article
            key={member.id}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-5 flex flex-col text-center"
          >
            <div className="mx-auto mb-4">
              <div className="relative w-32 h-48 border-2 border-accent overflow-hidden bg-gray-50 flex items-center justify-center">
                {member.photoUrl ? (
                  <Image
                    src={member.photoUrl}
                    alt={member.name}
                    fill
                    sizes="128px"
                    className="object-cover"
                    style={{ objectPosition: '50% 12%' }}
                  />
                ) : (
                  <span className="font-display text-3xl font-bold text-accent/40">
                    {initialsOf(member.name)}
                  </span>
                )}
              </div>
            </div>

            <h3 className="font-display text-[14px] font-bold text-primary leading-snug mb-2 line-clamp-2">
              <a
                href={`/faculty-member/${member.slug}`}
                className="hover:text-accent transition-colors"
              >
                {member.name}
              </a>
            </h3>
            <p className="text-[12px] text-gray-700 leading-snug mb-5 line-clamp-2">
              {member.designation}
            </p>

            <div className="mt-auto">
              <a
                href={`/faculty-member/${member.slug}`}
                className="inline-block px-5 py-2 bg-primary hover:bg-primary/90 text-white text-[12px] font-semibold rounded transition-colors"
              >
                View Profile
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
