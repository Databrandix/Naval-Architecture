import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import VisitorForm from '../VisitorForm';

export const metadata = { title: 'New visitor' };

export default async function NewVisitorPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add visitor</h1>
        <p className="mt-1 text-sm text-gray-500">New entry for <code className="font-mono">/student-society/visitor</code>.</p>
      </header>
      <VisitorForm initial={null} />
    </div>
  );
}
