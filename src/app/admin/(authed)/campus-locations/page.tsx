import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import CampusLocationList from './CampusLocationList';

export const metadata = { title: 'Campus Locations (CMS)' };

export default async function CampusLocationsAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const items = await prisma.campusLocation.findMany({ orderBy: { displayOrder: 'asc' } });

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Campus Locations</h1>
        <p className="mt-1 text-sm text-gray-500">
          Campus address cards rendered at the bottom of <code className="font-mono">/contact</code>. Drag to reorder.
        </p>
      </header>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Campuses</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {items.length} campus{items.length === 1 ? '' : 'es'}{items.length > 1 && ' · drag to reorder'}
            </p>
          </div>
          <Link href="/admin/campus-locations/new"
                className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40">
            <Plus size={16} /> Add campus
          </Link>
        </div>
        <CampusLocationList items={items} />
      </section>
    </div>
  );
}
