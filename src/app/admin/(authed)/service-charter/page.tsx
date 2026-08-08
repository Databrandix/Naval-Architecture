import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import ServiceCharterAdmin from './ServiceCharterAdmin';

export const metadata = { title: 'Service charter (CMS)' };

export default async function ServiceCharterAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const entries = await prisma.serviceCharterEntry.findMany({ orderBy: { displayOrder: 'asc' } });

  const services = entries.map((entry) => ({
    id: entry.id,
    serial: entry.serial,
    title: entry.title,
    responsible: entry.responsible,
    steps: Array.isArray(entry.steps)
      ? entry.steps.filter((step): step is string => typeof step === 'string')
      : [],
  }));

  return (
    <div className="max-w-3xl space-y-8">
      <header>
        <h1 className="font-display text-2xl font-bold text-gray-900">Service charter</h1>
        <p className="mt-1 text-sm text-gray-500">
          The services on <code className="font-mono">/student-society/service-charter</code> — what
          a student needs done, the steps, and who to contact.
        </p>
      </header>

      <ServiceCharterAdmin services={services} />
    </div>
  );
}
