import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import LabForm from '../LabForm';

type Params = { id: string };

export const metadata = { title: 'Edit lab' };

export default async function EditLabPage({ params }: { params: Promise<Params> }) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;
  const lab = await prisma.lab.findUnique({ where: { id } });
  if (!lab) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Edit lab: <span className="text-accent">{lab.name}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Slug: <code className="font-mono">/{lab.slug}</code>
        </p>
      </header>
      <LabForm initial={lab} />
    </div>
  );
}
