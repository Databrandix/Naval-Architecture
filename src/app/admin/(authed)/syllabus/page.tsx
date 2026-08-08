import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import SyllabusList from './SyllabusList';

export const metadata = { title: 'Syllabus (CMS)' };

export default async function SyllabusAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const items = await prisma.syllabus.findMany({ orderBy: { displayOrder: 'asc' } });

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Syllabus</h1>
        <p className="mt-1 text-sm text-gray-500">
          Syllabus entries for <code className="font-mono">/student-society/syllabus</code>. Drag to reorder.
        </p>
      </header>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Syllabi</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {items.length} syllabus{items.length === 1 ? '' : ' (multiple)'}{items.length > 1 && ' · drag to reorder'}
            </p>
          </div>
          <Link href="/admin/syllabus/new"
                className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40">
            <Plus size={16} /> Add syllabus
          </Link>
        </div>
        <SyllabusList items={items} />
      </section>
    </div>
  );
}
