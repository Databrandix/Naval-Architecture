import Image from 'next/image';
import { Briefcase, GraduationCap, IdCard, UserCircle2 } from 'lucide-react';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getAlumni, getPageHero } from '@/lib/identity';

export const metadata = {
  title: 'Alumni — Department of Electrical and Electronics Engineering',
  description:
    'Notable alumni from the Department of Mechanical Engineering, Sonargaon University.',
};

export default async function AlumniPage() {
  const [alumni, hero] = await Promise.all([
    getAlumni(),
    getPageHero('student-society-alumni'),
  ]);

  return (
    <PageShell
      title={hero?.heroTitle ?? 'Our Alumni'}
      subtitle={hero?.heroSubtitle ?? undefined}
      overline={hero?.heroOverline ?? 'Student Society'}
      image={hero?.heroImageUrl ?? '/assets/alumni-hero.webp'}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : undefined}
      contentClassName="bg-gray-50 py-12 md:py-16"
    >
      <Container>
        {alumni.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">No alumni yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {alumni.map((person) => (
              <article
                key={person.id}
                className="flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
                  {person.photoUrl ? (
                    <Image
                      src={person.photoUrl}
                      alt={person.name}
                      fill
                      sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">
                      <UserCircle2 size={64} />
                    </div>
                  )}
                </div>

                <div className="p-5 flex flex-col gap-3 flex-1">
                  <h3 className="text-[17px] font-bold text-primary leading-snug">
                    {person.name}
                  </h3>

                  <div className="inline-flex items-center gap-1.5 self-start rounded-md bg-primary/5 px-2.5 py-1.5 text-[14px] font-mono font-semibold tracking-tight text-primary ring-1 ring-primary/10">
                    <IdCard size={16} className="text-accent" />
                    {person.studentId}
                  </div>

                  <div className="flex items-start gap-2 text-[13px] text-gray-600 leading-snug">
                    <Briefcase size={15} className="mt-0.5 shrink-0 text-accent" />
                    <span>
                      <span className="font-medium text-gray-800">{person.designation}</span>
                      {person.company && (
                        <>
                          <span className="text-gray-400">, </span>
                          <span>{person.company}</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="mt-auto pt-3 border-t border-gray-100">
                    <span className="inline-flex items-center gap-2 rounded-md bg-gray-50 px-3 py-1.5 text-[12px] font-medium text-gray-700">
                      <GraduationCap size={14} className="text-primary" />
                      {person.department}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>
    </PageShell>
  );
}
