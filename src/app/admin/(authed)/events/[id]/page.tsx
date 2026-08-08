import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import EventForm from '../EventForm';

type Params = { id: string };

export const metadata = { title: 'Edit event' };

export default async function EditEventPage({ params }: { params: Promise<Params> }) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Edit event: <span className="text-accent">{event.shortTitle}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          URL: <code className="font-mono">/student-society/events/{event.slug}</code>
        </p>
      </header>
      <EventForm initial={event} />
    </div>
  );
}
