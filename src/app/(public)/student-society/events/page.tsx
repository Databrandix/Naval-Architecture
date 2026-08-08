import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getEvents, getPageHero } from '@/lib/identity';
import EventsClient from './EventsClient';
import { departmentMetadata } from '@/lib/page-metadata';

export async function generateMetadata() {
  return departmentMetadata({
    title: 'Events',
    description:
      'Departmental events from the EEE Department at Sonargaon University — sports, industrial visits, seminars, exhibitions.',
  });
}

export default async function EventsPage() {
  const [events, hero] = await Promise.all([
    getEvents(),
    getPageHero('student-society-events'),
  ]);

  return (
    <PageShell
      title={hero?.heroTitle ?? 'Events'}
      subtitle={hero?.heroSubtitle ?? undefined}
      overline={hero?.heroOverline ?? 'Student'}
      image={hero?.heroImageUrl ?? '/assets/events-hero.webp'}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : undefined}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        {events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">No events yet.</p>
          </div>
        ) : (
          <EventsClient
            events={events.map((e) => ({
              slug:        e.slug,
              shortTitle:  e.shortTitle,
              summary:     e.summary,
              category:    e.category,
              status:      e.status,
              imageUrl:    e.imageUrl,
              eventDate:   e.eventDate ? e.eventDate.toISOString() : null,
              displayDate: e.displayDate,
              time:        e.time,
            }))}
          />
        )}
      </Container>
    </PageShell>
  );
}
