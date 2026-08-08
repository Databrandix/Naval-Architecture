import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import EventsList from './EventsList';

export const metadata = { title: 'Events (CMS)' };

export default async function EventsAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const events = await prisma.event.findMany({
    orderBy: [{ eventDate: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
  });

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Events</h1>
        <p className="mt-1 text-sm text-gray-500">
          Events for <code className="font-mono">/student-society/events</code> and the homepage EventsSection. Sorted by event date (newest first; undated rows last).
        </p>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Events</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {events.length} event{events.length === 1 ? '' : 's'}
            </p>
          </div>
          <Link
            href="/admin/events/new"
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <Plus size={16} /> Add event
          </Link>
        </div>
        <EventsList items={events} />
      </section>
    </div>
  );
}
