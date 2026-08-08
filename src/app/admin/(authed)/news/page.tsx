import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import NewsList from './NewsList';

export const metadata = { title: 'News (CMS)' };

export default async function NewsAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const news = await prisma.news.findMany({ orderBy: { publishedAt: 'desc' } });

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">News</h1>
        <p className="mt-1 text-sm text-gray-500">
          Articles for <code className="font-mono">/news</code> and the homepage NewsSection. Sorted by published date (newest first).
        </p>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Articles</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {news.length} article{news.length === 1 ? '' : 's'}
            </p>
          </div>
          <Link
            href="/admin/news/new"
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <Plus size={16} /> Add article
          </Link>
        </div>
        <NewsList items={news} />
      </section>
    </div>
  );
}
