import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import DepartmentLayoutForm from '../DepartmentLayoutForm';

export const metadata = { title: 'New Department Layout' };

export default async function NewDepartmentLayoutPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">New Department Layout</h1>
        <p className="mt-1 text-sm text-gray-500">Add a new layout card for <code className="font-mono">/about/department-layout</code>.</p>
      </header>
      <DepartmentLayoutForm initial={null} />
    </div>
  );
}
