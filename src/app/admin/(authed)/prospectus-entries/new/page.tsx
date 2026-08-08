import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import ProspectusForm from '../ProspectusForm';

export const metadata = { title: 'New prospectus' };

export default async function NewProspectusPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add prospectus</h1>
        <p className="mt-1 text-sm text-gray-500">New program prospectus for <code className="font-mono">/admission/prospectus</code>.</p>
      </header>
      <ProspectusForm initial={null} />
    </div>
  );
}
