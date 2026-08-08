import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import AdmissionNoticeList from './AdmissionNoticeList';

export const metadata = { title: 'Admission Notices (CMS)' };

export default async function AdmissionNoticesAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const items = await prisma.admissionNotice.findMany({ orderBy: { displayOrder: 'asc' } });

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Admission Notices</h1>
        <p className="mt-1 text-sm text-gray-500">
          Formal Registrar letters for <code className="font-mono">/admission/notice</code>. The page renders the latest active notice (newest <code className="font-mono">publishedAt</code> where <code className="font-mono">isActive=true</code>); toggle active to swap the visible one.
        </p>
      </header>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Notices</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {items.length} notice{items.length === 1 ? '' : 's'}{items.length > 1 && ' · drag to reorder'}
            </p>
          </div>
          <Link href="/admin/admission-notices/new"
                className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40">
            <Plus size={16} /> Add notice
          </Link>
        </div>
        <AdmissionNoticeList items={items} />
      </section>
    </div>
  );
}
