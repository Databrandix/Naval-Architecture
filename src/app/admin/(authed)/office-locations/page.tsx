import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import OfficeLocationsAdmin from './OfficeLocationsAdmin';

export const metadata = { title: 'Office locations (CMS)' };

export default async function OfficeLocationsAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const offices = await prisma.officeLocation.findMany({ orderBy: { displayOrder: 'asc' } });

  return (
    <div className="max-w-3xl space-y-8">
      <header>
        <h1 className="font-display text-2xl font-bold text-gray-900">Office locations</h1>
        <p className="mt-1 text-sm text-gray-500">
          The directory on <code className="font-mono">/about/department-layout</code> — which
          office is on which level. Offices marked as this department&rsquo;s are listed first.
        </p>
      </header>

      <OfficeLocationsAdmin offices={offices} />
    </div>
  );
}
