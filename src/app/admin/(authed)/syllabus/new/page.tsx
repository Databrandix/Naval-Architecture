import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import SyllabusForm from '../SyllabusForm';

export const metadata = { title: 'New syllabus' };

export default async function NewSyllabusPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add syllabus</h1>
        <p className="mt-1 text-sm text-gray-500">New syllabus for <code className="font-mono">/student-society/syllabus</code>.</p>
      </header>
      <SyllabusForm initial={null} />
    </div>
  );
}
