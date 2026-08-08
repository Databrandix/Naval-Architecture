import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import TransportLandingForm from './TransportLandingForm';

export const metadata = { title: 'Transport Landing (CMS)' };

export default async function TransportLandingAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const landing = await prisma.transportLanding.findUnique({ where: { id: 'singleton' } });

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Transport Landing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Page chrome for <code className="font-mono">/transport-service</code> — intro, free-service banner, and the &quot;Important Instructions&quot; bullets. Bus routes themselves are edited via <a href="/admin/bus-routes" className="text-accent hover:underline">Bus Routes</a>.
        </p>
      </header>
      <TransportLandingForm initial={landing} />
    </div>
  );
}
