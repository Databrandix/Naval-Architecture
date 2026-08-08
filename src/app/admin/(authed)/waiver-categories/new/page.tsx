import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import WaiverCategoryForm from '../WaiverCategoryForm';

export const metadata = { title: 'New waiver category' };

export default async function NewWaiverCategoryPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add waiver category</h1>
        <p className="mt-1 text-sm text-gray-500">New tuition waiver category card for <code className="font-mono">/admission/waiver-scholarship</code>.</p>
      </header>
      <WaiverCategoryForm initial={null} />
    </div>
  );
}
