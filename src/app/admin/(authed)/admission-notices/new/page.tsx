import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import AdmissionNoticeForm from '../AdmissionNoticeForm';

export const metadata = { title: 'New admission notice' };

export default async function NewAdmissionNoticePage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add admission notice</h1>
        <p className="mt-1 text-sm text-gray-500">New formal Registrar letter for <code className="font-mono">/admission/notice</code>.</p>
      </header>
      <AdmissionNoticeForm initial={null} />
    </div>
  );
}
