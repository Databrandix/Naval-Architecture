import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import ResearchAreaForm from '../ResearchAreaForm';

export const metadata = { title: 'Edit research area' };

export default async function EditResearchAreaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;
  const area = await prisma.researchArea.findUnique({ where: { id } });
  if (!area) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          {area.areaName}
        </h1>
      </header>
      <ResearchAreaForm initial={area} />
    </div>
  );
}
