import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import BusRouteForm from '../BusRouteForm';

export const metadata = { title: 'Edit bus route' };

export default async function EditBusRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;
  const route = await prisma.busRoute.findUnique({ where: { id } });
  if (!route) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Edit route: <span className="text-accent">{route.routeName}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Slug: <code className="font-mono">{route.slug}</code>
        </p>
      </header>
      <BusRouteForm initial={route} />
    </div>
  );
}
