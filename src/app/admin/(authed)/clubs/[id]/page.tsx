import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import ClubForm from '../ClubForm';

export const metadata = { title: 'Edit club' };

export default async function EditClubPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;
  const club = await prisma.club.findUnique({ where: { id } });
  if (!club) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Edit club: <span className="text-accent">{club.name}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Slug: <code className="font-mono">{club.slug}</code>
        </p>
      </header>
      <ClubForm initial={club} />
    </div>
  );
}
