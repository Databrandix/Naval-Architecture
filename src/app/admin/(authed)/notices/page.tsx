import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import NoticesList from './NoticesList';

export const metadata = { title: 'Notices (CMS)' };

export default async function NoticesAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const notices = await prisma.notice.findMany({ orderBy: { publishedAt: 'desc' } });

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Notices</h1>
        <p className="mt-1 text-sm text-gray-500">
          Notices for <code className="font-mono">/student-society/notice-board</code> and the homepage NoticesSection. Sorted by published date (newest first). Notices link to an attached image or PDF; the public page has no per-notice detail route.
        </p>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Notices</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {notices.length} notice{notices.length === 1 ? '' : 's'}
            </p>
          </div>
          <Link
            href="/admin/notices/new"
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <Plus size={16} /> Add notice
          </Link>
        </div>
        <NoticesList items={notices} />
      </section>
    </div>
  );
}
