import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import ProspectusForm from '../ProspectusForm';

export const metadata = { title: 'Edit prospectus' };

export default async function EditProspectusPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;
  const item = await prisma.prospectusEntry.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Edit prospectus: <span className="text-accent">{item.shortTitle}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Slug: <code className="font-mono">{item.slug}</code> · {item.level}
        </p>
      </header>
      <ProspectusForm initial={item} />
    </div>
  );
}
