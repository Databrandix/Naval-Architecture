import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import ScholarshipList from './ScholarshipList';

export const metadata = { title: 'Scholarships (CMS)' };

export default async function ScholarshipsAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const items = await prisma.scholarship.findMany({ orderBy: { displayOrder: 'asc' } });

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Scholarships (Merit Slabs)</h1>
        <p className="mt-1 text-sm text-gray-500">
          Merit scholarship slab cards rendered in Part 02 of <code className="font-mono">/admission/waiver-scholarship</code>. Drag to reorder.
        </p>
      </header>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Slabs</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {items.length} slab{items.length === 1 ? '' : 's'}{items.length > 1 && ' · drag to reorder'}
            </p>
          </div>
          <Link href="/admin/scholarships/new"
                className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40">
            <Plus size={16} /> Add slab
          </Link>
        </div>
        <ScholarshipList items={items} />
      </section>
    </div>
  );
}
