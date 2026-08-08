import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import ScholarshipForm from '../ScholarshipForm';

export const metadata = { title: 'New scholarship slab' };

export default async function NewScholarshipPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add scholarship slab</h1>
        <p className="mt-1 text-sm text-gray-500">New merit scholarship slab card for <code className="font-mono">/admission/waiver-scholarship</code>.</p>
      </header>
      <ScholarshipForm initial={null} />
    </div>
  );
}
