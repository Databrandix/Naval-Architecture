import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import BusRouteForm from '../BusRouteForm';

export const metadata = { title: 'New bus route' };

export default async function NewBusRoutePage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add bus route</h1>
        <p className="mt-1 text-sm text-gray-500">New route for <code className="font-mono">/transport-service</code>.</p>
      </header>
      <BusRouteForm initial={null} />
    </div>
  );
}
