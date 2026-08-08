import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import LaboratoryLabForm from '../LaboratoryLabForm';

export const metadata = { title: 'New laboratory' };

export default async function NewLaboratoryLabPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add laboratory</h1>
        <p className="mt-1 text-sm text-gray-500">Create a new laboratory grid card for <code className="font-mono">/about/laboratory-facility</code>.</p>
      </header>
      <LaboratoryLabForm initial={null} />
    </div>
  );
}
