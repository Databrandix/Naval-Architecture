import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import Link from 'next/link';
import { Plus, Pencil, GripVertical } from 'lucide-react';
import DepartmentLayoutList from './DepartmentLayoutList';

export const metadata = { title: 'Department Layout' };

export default async function DepartmentLayoutPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');
  const rows = await prisma.departmentLayout.findMany({ orderBy: { displayOrder: 'asc' } });
  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Department Layout</h1>
          <p className="mt-1 text-sm text-gray-500">Manage department layout cards for <code className="font-mono">/about/department-layout</code>.</p>
        </div>
        <Link href="/admin/department-layout/new" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg text-sm transition-colors"><Plus size={16} /> Add layout</Link>
      </header>
      {rows.length === 0 ? <div className="bg-white border border-dashed border-gray-300 rounded-lg p-12 text-center"><p className="text-gray-500">No department layouts yet.</p></div> : <DepartmentLayoutList rows={rows} />}
    </div>
  );
}
