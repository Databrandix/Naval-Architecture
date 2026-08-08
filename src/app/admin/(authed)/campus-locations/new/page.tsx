import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import CampusLocationForm from '../CampusLocationForm';

export const metadata = { title: 'New campus location' };

export default async function NewCampusLocationPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add campus location</h1>
        <p className="mt-1 text-sm text-gray-500">New campus card for <code className="font-mono">/contact</code>.</p>
      </header>
      <CampusLocationForm initial={null} />
    </div>
  );
}
