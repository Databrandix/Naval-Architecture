import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import UniversityForm from './UniversityForm';

export const metadata = { title: 'University Identity' };

export default async function UniversityIdentityPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const university = await prisma.universityIdentity.findUnique({
    where: { id: 'singleton' },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          University Identity
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Address, contact info, social URLs, footer logo, and copyright.
        </p>
      </header>
      <UniversityForm initial={university} />
    </div>
  );
}
