import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import FaqForm from '../FaqForm';

export const metadata = { title: 'New FAQ' };

export default async function NewFaqPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add FAQ</h1>
        <p className="mt-1 text-sm text-gray-500">New Q&amp;A pair for <code className="font-mono">/student-society/faq</code>.</p>
      </header>
      <FaqForm initial={null} />
    </div>
  );
}
