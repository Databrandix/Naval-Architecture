import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import LabForm from '../LabForm';

export const metadata = { title: 'New lab' };

export default async function NewLabPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add lab</h1>
        <p className="mt-1 text-sm text-gray-500">Create a new lab for <code className="font-mono">/about/lab-facility</code>.</p>
      </header>
      <LabForm initial={null} />
    </div>
  );
}
