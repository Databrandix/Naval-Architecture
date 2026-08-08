import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import ProgramFeeStructureForm from './ProgramFeeStructureForm';

export const metadata = { title: 'Edit fee structure' };

export default async function EditProgramFeeStructurePage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { programId } = await params;
  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: { feeStructure: true },
  });
  if (!program) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <Link href="/admin/program-fee-structures" className="text-xs text-gray-500 hover:text-accent transition-colors">
          ← All programs
        </Link>
        <h1 className="text-2xl font-display font-bold text-gray-900 mt-2">
          Fee structure: <span className="text-accent">{program.programName}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          <code className="font-mono">{program.degreeCode}</code> · {program.feeStructure ? 'Edit existing fee structure' : 'Create new fee structure for this program'}
        </p>
      </header>
      <ProgramFeeStructureForm program={{ id: program.id, programName: program.programName, degreeCode: program.degreeCode }}
                                initial={program.feeStructure} />
    </div>
  );
}
