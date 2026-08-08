import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import NoticeForm from '../NoticeForm';

export const metadata = { title: 'New notice' };

export default async function NewNoticePage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add notice</h1>
        <p className="mt-1 text-sm text-gray-500">
          New notice for <code className="font-mono">/student-society/notice-board</code>.
        </p>
      </header>
      <NoticeForm initial={null} />
    </div>
  );
}
