import Image from 'next/image';
import { notFound } from 'next/navigation';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import MessageParagraphs from '@/components/sections/MessageParagraphs';
import { departmentMetadata } from '@/lib/page-metadata';
import {
  getHead,
  getDepartmentIdentity,
  getUniversityIdentity,
} from '@/lib/identity';

export async function generateMetadata() {
  return departmentMetadata({
    title: 'Message from Head',
    description:
      'Welcome message from the Head of the Department of Mechanical Engineering, Sonargaon University.',
  });
}

const FALLBACK_HERO = '/assets/message-from-head-hero.webp';

export default async function MessageFromHeadPage() {
  const [head, dept, uni] = await Promise.all([
    getHead(),
    getDepartmentIdentity(),
    getUniversityIdentity(),
  ]);
  if (!head) notFound();

  const profilePhoto = head.messagePhotoUrl ?? head.photoUrl ?? null;

  // Head's-message page uses a circular crop (vs Dean's rectangular).
  // The presentation difference between the two /about pages is
  // intentional and stays per-page rather than sharing a wrapper.
  return (
    <PageShell
      title="Message from Head"
      overline="About"
      image={head.messageHeroImageUrl ?? FALLBACK_HERO}
      imagePosition={`center ${head.messageHeroImageVerticalPercent}%`}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        <div className="relative bg-primary text-white rounded-2xl shadow-2xl">
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-72 h-72 bg-accent/15 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          </div>

          <div className="relative p-5 md:p-12 lg:p-16">
            <div className="grid gap-10 lg:gap-16 lg:grid-cols-[260px_1fr] items-start">
              {/* Profile column */}
              <div className="flex flex-col items-center text-center lg:sticky lg:top-32">
                {profilePhoto && (
                  <div className="relative w-52 h-52 rounded-full overflow-hidden ring-4 ring-white/20 shadow-xl mb-5 bg-white/5">
                    <Image
                      src={profilePhoto}
                      alt={head.name}
                      fill
                      sizes="208px"
                      className="object-cover"
                    />
                  </div>
                )}
                <h3 className="font-display text-xl font-bold mb-1">{head.name}</h3>
                {head.messageTitleLine1 && (
                  <p className="text-white/75 text-sm mb-1">{head.messageTitleLine1}</p>
                )}
                {head.messageTitleLine2 && (
                  <p className="text-white/60 text-sm">{head.messageTitleLine2}</p>
                )}
              </div>

              {/* Message column */}
              <div>
                <div className="mb-8">
                  {head.messageOverline && (
                    <span className="inline-block text-button-yellow text-[11px] font-bold tracking-[0.3em] uppercase mb-2">
                      {head.messageOverline}
                    </span>
                  )}
                  {head.messageHeading && (
                    <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight">
                      {head.messageHeading}
                    </h2>
                  )}
                  <div className="mt-3 h-1 w-16 bg-button-yellow rounded-full" />
                </div>

                <MessageParagraphs paragraphs={head.messageParagraphs} />

                {/* Signature */}
                <div className="mt-10 pt-6 border-t border-white/15">
                  <p className="font-display font-bold text-lg text-button-yellow">{head.name}</p>
                  {head.messageTitleLine1 && (
                    <p className="text-white/80 text-sm mt-1">{head.messageTitleLine1}</p>
                  )}
                  <p className="text-white/70 text-sm">{dept.name}</p>
                  <p className="text-white/70 text-sm">{uni.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </PageShell>
  );
}
