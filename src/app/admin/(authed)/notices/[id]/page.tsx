import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import NoticeForm from '../NoticeForm';

type Params = { id: string };

export const metadata = { title: 'Edit notice' };

export default async function EditNoticePage({ params }: { params: Promise<Params> }) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;
  const notice = await prisma.notice.findUnique({ where: { id } });
  if (!notice) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Edit notice: <span className="text-accent">{notice.title}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Slug: <code className="font-mono">/{notice.slug}</code>
        </p>
      </header>
      <NoticeForm initial={notice} />
    </div>
  );
}
