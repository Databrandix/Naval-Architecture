import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import FacultyForm from '../FacultyForm';

export const metadata = { title: 'Edit faculty' };

export default async function EditFacultyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;
  const [faculty, currentDean, currentHead] = await Promise.all([
    prisma.faculty.findUnique({ where: { id } }),
    prisma.faculty.findFirst({
      where: { isDean: true },
      select: { id: true, name: true },
    }),
    prisma.faculty.findFirst({
      where: { isHead: true },
      select: { id: true, name: true },
    }),
  ]);
  if (!faculty) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">{faculty.name}</h1>
        <p className="mt-1 text-sm text-gray-500 font-mono">{faculty.slug}</p>
      </header>
      <FacultyForm
        initial={faculty}
        currentDean={currentDean}
        currentHead={currentHead}
      />
    </div>
  );
}
