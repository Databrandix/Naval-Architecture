import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import ResearchAreasList from './ResearchAreasList';

export const metadata = { title: 'Research Areas' };

export default async function ResearchAreasPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const areas = await prisma.researchArea.findMany({
    orderBy: { displayOrder: 'asc' },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Research Areas</h1>
          <p className="mt-1 text-sm text-gray-500">
            {areas.length} area{areas.length === 1 ? '' : 's'}
            {areas.length > 1 && ' · drag to reorder'}
          </p>
        </div>
        <Link
          href="/admin/research-areas/new"
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          <Plus size={16} /> Add research area
        </Link>
      </header>

      <ResearchAreasList items={areas} />
    </div>
  );
}
