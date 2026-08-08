import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import CampusLocationForm from '../CampusLocationForm';

export const metadata = { title: 'Edit campus location' };

export default async function EditCampusLocationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;
  const item = await prisma.campusLocation.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Edit campus: <span className="text-accent">{item.name}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Slug: <code className="font-mono">{item.slug}</code>
        </p>
      </header>
      <CampusLocationForm initial={item} />
    </div>
  );
}
