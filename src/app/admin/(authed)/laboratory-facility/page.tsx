import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import LaboratoryFacilityLandingForm from './LaboratoryFacilityLandingForm';
import LaboratoryLabsList from './LaboratoryLabsList';

export const metadata = { title: 'Laboratory Facility (CMS)' };

export default async function LaboratoryFacilityAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const [landing, labs] = await Promise.all([
    prisma.laboratoryFacilityLanding.findUnique({ where: { id: 'singleton' } }),
    prisma.laboratoryLab.findMany({ orderBy: { displayOrder: 'asc' } }),
  ]);

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Laboratory Facility</h1>
        <p className="mt-1 text-sm text-gray-500">
          Landing content + lab grid for <code className="font-mono">/about/laboratory-facility</code>.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Landing</h2>
        <LaboratoryFacilityLandingForm initial={landing} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Laboratories (grid cards)</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {labs.length} laborator{labs.length === 1 ? 'y' : 'ies'}
              {labs.length > 1 && ' · drag to reorder'}
            </p>
          </div>
          <Link
            href="/admin/laboratory-facility/labs/new"
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <Plus size={16} /> Add laboratory
          </Link>
        </div>
        <LaboratoryLabsList items={labs} />
      </section>
    </div>
  );
}
