import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import EventForm from '../EventForm';

export const metadata = { title: 'New event' };

export default async function NewEventPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add event</h1>
        <p className="mt-1 text-sm text-gray-500">
          New event for <code className="font-mono">/student-society/events</code>.
        </p>
      </header>
      <EventForm initial={null} />
    </div>
  );
}
