import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import AlumniForm from '../AlumniForm';

export const metadata = { title: 'Edit alumni' };

export default async function EditAlumniPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;
  const alumni = await prisma.alumni.findUnique({ where: { id } });
  if (!alumni) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Edit alumni: <span className="text-accent">{alumni.name}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Slug: <code className="font-mono">{alumni.slug}</code>
        </p>
      </header>
      <AlumniForm initial={alumni} />
    </div>
  );
}
