import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import AdmissionNoticeForm from '../AdmissionNoticeForm';

export const metadata = { title: 'Edit admission notice' };

export default async function EditAdmissionNoticePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;
  const item = await prisma.admissionNotice.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Edit admission notice: <span className="text-accent">{item.subject}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Ref: <code className="font-mono">{item.refNo}</code> · Slug: <code className="font-mono">{item.slug}</code> · {item.isActive ? 'Active' : 'Inactive'}
        </p>
      </header>
      <AdmissionNoticeForm initial={item} />
    </div>
  );
}
