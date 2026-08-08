import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import DepartmentForm from './DepartmentForm';

export const metadata = { title: 'Department Identity' };

export default async function DepartmentIdentityPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const department = await prisma.departmentIdentity.findUnique({
    where: { id: 'singleton' },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Department Identity
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Brand colors, logo, hero images, and naming for the department.
        </p>
      </header>
      <DepartmentForm initial={department} />
    </div>
  );
}
