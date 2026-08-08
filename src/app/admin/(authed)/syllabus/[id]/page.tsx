import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import SyllabusForm from '../SyllabusForm';

export const metadata = { title: 'Edit syllabus' };

export default async function EditSyllabusPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;
  const item = await prisma.syllabus.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Edit syllabus: <span className="text-accent">{item.shortTitle}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Slug: <code className="font-mono">{item.slug}</code> · {item.level}
        </p>
      </header>
      <SyllabusForm initial={item} />
    </div>
  );
}
