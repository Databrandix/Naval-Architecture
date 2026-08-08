import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import FacultyForm from '../FacultyForm';

export const metadata = { title: 'Add faculty' };

export default async function NewFacultyPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  // Need to know the current Dean/Head holders so the form can
  // surface a confirmation dialog if the user is about to take
  // a role away from someone else.
  const [currentDean, currentHead] = await Promise.all([
    prisma.faculty.findFirst({
      where: { isDean: true },
      select: { id: true, name: true },
    }),
    prisma.faculty.findFirst({
      where: { isHead: true },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add a faculty member</h1>
        <p className="mt-1 text-sm text-gray-500">
          New faculty rows are appended to the end of the list; reorder afterwards from the list page (use the All filter).
        </p>
      </header>
      <FacultyForm
        initial={null}
        currentDean={currentDean}
        currentHead={currentHead}
      />
    </div>
  );
}
