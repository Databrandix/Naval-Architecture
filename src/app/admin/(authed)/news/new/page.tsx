import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import NewsForm from '../NewsForm';

export const metadata = { title: 'New news article' };

export default async function NewNewsArticlePage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add news article</h1>
        <p className="mt-1 text-sm text-gray-500">
          New article for <code className="font-mono">/news</code>.
        </p>
      </header>
      <NewsForm initial={null} />
    </div>
  );
}
