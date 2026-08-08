import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import BusRoutesList from './BusRoutesList';

export const metadata = { title: 'Bus Routes (CMS)' };

export default async function BusRoutesAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const routes = await prisma.busRoute.findMany({ orderBy: { displayOrder: 'asc' } });

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Bus Routes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Route grid for <code className="font-mono">/transport-service</code>. Drag to reorder. The page chrome (intro / banner / instructions) is edited via <Link href="/admin/transport-landing" className="text-accent hover:underline">Transport Landing</Link>.
        </p>
      </header>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Routes</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {routes.length} route{routes.length === 1 ? '' : 's'}{routes.length > 1 && ' · drag to reorder'}
            </p>
          </div>
          <Link href="/admin/bus-routes/new"
                className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40">
            <Plus size={16} /> Add route
          </Link>
        </div>
        <BusRoutesList items={routes} />
      </section>
    </div>
  );
}
