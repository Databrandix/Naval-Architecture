import Image from 'next/image';
import { notFound } from 'next/navigation';
import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import MessageParagraphs from '@/components/sections/MessageParagraphs';
import { getDean, getUniversityIdentity } from '@/lib/identity';

export const metadata = {
  title: "Dean's Message — Faculty of Science and Engineering",
  description:
    "Message from the Dean of the Faculty of Science and Engineering, Sonargaon University.",
};

const FALLBACK_HERO = '/assets/mission-vision-hero.webp';

export default async function DeansMessagePage() {
  const [dean, uni] = await Promise.all([getDean(), getUniversityIdentity()]);
  if (!dean) notFound();

  // messagePhotoUrl is the override; fall back to the main photoUrl
  // when the admin hasn't set a separate message photo.
  const profilePhoto = dean.messagePhotoUrl ?? dean.photoUrl ?? null;

  return (
    <PageShell
      title="Dean's Message"
      overline="About"
      image={dean.messageHeroImageUrl ?? FALLBACK_HERO}
      imagePosition={`center ${dean.messageHeroImageVerticalPercent}%`}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        <div className="relative bg-primary text-white rounded-2xl shadow-2xl">
          {/* Decorative accents — clipped in their own wrapper so sticky works on children */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-72 h-72 bg-accent/15 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          </div>

          <div className="relative p-5 md:p-12 lg:p-16">
            <div className="grid gap-10 lg:gap-16 lg:grid-cols-[260px_1fr] items-start">
              {/* Profile column */}
              <div className="flex flex-col items-center text-center lg:sticky lg:top-32">
                {profilePhoto && (
                  <div className="relative w-52 rounded-2xl overflow-hidden ring-4 ring-white/20 shadow-xl mb-5 bg-white/5">
                    <Image
                      src={profilePhoto}
                      alt={dean.name}
                      width={400}
                      height={500}
                      sizes="208px"
                      className="block w-full h-auto"
                    />
                  </div>
                )}
                <h3 className="font-display text-xl font-bold mb-1">{dean.name}</h3>
                {dean.messageTitleLine1 && (
                  <p className="text-white/75 text-sm mb-1">{dean.messageTitleLine1}</p>
                )}
                {dean.messageTitleLine2 && (
                  <p className="text-white/60 text-sm">{dean.messageTitleLine2}</p>
                )}
              </div>

              {/* Message column */}
              <div>
                <div className="mb-8">
                  {dean.messageOverline && (
                    <span className="inline-block text-button-yellow text-[11px] font-bold tracking-[0.3em] uppercase mb-2">
                      {dean.messageOverline}
                    </span>
                  )}
                  {dean.messageHeading && (
                    <h2 className="font-display text-3xl md:text-4xl font-bold leading-tight">
                      {dean.messageHeading}
                    </h2>
                  )}
                  <div className="mt-3 h-1 w-16 bg-button-yellow rounded-full" />
                </div>

                <MessageParagraphs paragraphs={dean.messageParagraphs} />

                {/* Signature */}
                <div className="mt-10 pt-6 border-t border-white/15">
                  <p className="font-display font-bold text-lg text-button-yellow">{dean.name}</p>
                  {dean.messageTitleLine1 && (
                    <p className="text-white/80 text-sm mt-1">{dean.messageTitleLine1}</p>
                  )}
                  {dean.messageTitleLine2 && (
                    <p className="text-white/70 text-sm">{dean.messageTitleLine2}</p>
                  )}
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
