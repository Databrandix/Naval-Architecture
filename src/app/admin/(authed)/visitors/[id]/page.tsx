import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import VisitorForm from '../VisitorForm';

export const metadata = { title: 'Edit visitor' };

export default async function EditVisitorPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;
  const visitor = await prisma.visitor.findUnique({ where: { id } });
  if (!visitor) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Edit visitor: <span className="text-accent">{visitor.name}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Slug: <code className="font-mono">{visitor.slug}</code>
        </p>
      </header>
      <VisitorForm initial={visitor} />
    </div>
  );
}
