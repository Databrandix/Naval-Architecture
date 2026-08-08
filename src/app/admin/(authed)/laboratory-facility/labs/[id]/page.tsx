import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import LaboratoryLabForm from '../LaboratoryLabForm';

type Params = { id: string };

export const metadata = { title: 'Edit laboratory' };

export default async function EditLaboratoryLabPage({ params }: { params: Promise<Params> }) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;
  const lab = await prisma.laboratoryLab.findUnique({ where: { id } });
  if (!lab) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Edit laboratory: <span className="text-accent">{lab.title}</span>
        </h1>
      </header>
      <LaboratoryLabForm initial={lab} />
    </div>
  );
}
