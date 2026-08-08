import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import ClubForm from '../ClubForm';

export const metadata = { title: 'New club' };

export default async function NewClubPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add club</h1>
        <p className="mt-1 text-sm text-gray-500">New entry for <code className="font-mono">/student-society/club-list</code>.</p>
      </header>
      <ClubForm initial={null} />
    </div>
  );
}
