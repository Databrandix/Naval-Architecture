import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import DepartmentLayoutForm from '../DepartmentLayoutForm';

export const metadata = { title: 'Edit Department Layout' };

export default async function EditDepartmentLayoutPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');
  const { id } = await params;
  const row = await prisma.departmentLayout.findUnique({ where: { id } });
  if (!row) redirect('/admin/department-layout');
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Edit Department Layout</h1>
        <p className="mt-1 text-sm text-gray-500"><code className="font-mono">{row.slug}</code></p>
      </header>
      <DepartmentLayoutForm initial={row} />
    </div>
  );
}
