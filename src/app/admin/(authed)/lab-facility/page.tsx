import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import LabFacilityLandingForm from './LabFacilityLandingForm';
import LabsList from './LabsList';

export const metadata = { title: 'Lab Facility (CMS)' };

export default async function LabFacilityAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const [landing, labs] = await Promise.all([
    prisma.labFacilityLanding.findUnique({ where: { id: 'singleton' } }),
    prisma.lab.findMany({ orderBy: { displayOrder: 'asc' } }),
  ]);

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Lab Facility</h1>
        <p className="mt-1 text-sm text-gray-500">
          Landing content + lab list for <code className="font-mono">/about/lab-facility</code>. New labs also surface on the homepage carousel.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Landing</h2>
        <LabFacilityLandingForm initial={landing} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Labs</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {labs.length} lab{labs.length === 1 ? '' : 's'}
              {labs.length > 1 && ' · drag to reorder'}
            </p>
          </div>
          <Link
            href="/admin/lab-facility/labs/new"
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <Plus size={16} /> Add lab
          </Link>
        </div>
        <LabsList items={labs} />
      </section>
    </div>
  );
}
