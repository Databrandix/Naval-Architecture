import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import ProgramForm from '../ProgramForm';

export const metadata = { title: 'Edit program' };

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;
  const program = await prisma.program.findUnique({ where: { id } });
  if (!program) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          {program.programName}
        </h1>
        <p className="mt-1 text-sm text-gray-500 font-mono">
          {program.degreeCode}
        </p>
      </header>
      <ProgramForm initial={program} />
    </div>
  );
}
