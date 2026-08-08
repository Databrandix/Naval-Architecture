import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import ProgramForm from '../ProgramForm';

export const metadata = { title: 'Add program' };

export default async function NewProgramPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add a program</h1>
        <p className="mt-1 text-sm text-gray-500">
          New programs are appended to the end of the list; reorder afterwards from the list page.
        </p>
      </header>
      <ProgramForm initial={null} />
    </div>
  );
}
