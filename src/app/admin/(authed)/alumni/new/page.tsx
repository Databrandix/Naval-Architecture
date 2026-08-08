import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import AlumniForm from '../AlumniForm';

export const metadata = { title: 'New alumni' };

export default async function NewAlumniPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add alumni</h1>
        <p className="mt-1 text-sm text-gray-500">New entry for <code className="font-mono">/student-society/alumni</code>.</p>
      </header>
      <AlumniForm initial={null} />
    </div>
  );
}
