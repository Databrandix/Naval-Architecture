import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import AboutOverviewForm from './AboutOverviewForm';

export const metadata = { title: 'About — Overview' };

export default async function AboutOverviewPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const row = await prisma.aboutOverview.findUnique({ where: { id: 'singleton' } });

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">About — Overview</h1>
        <p className="mt-1 text-sm text-gray-500">
          Hero + paragraph content for <code className="font-mono">/about/overview</code>.
        </p>
      </header>
      <AboutOverviewForm initial={row} />
    </div>
  );
}
