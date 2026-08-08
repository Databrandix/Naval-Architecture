import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import AboutEeeClubForm from './AboutEeeClubForm';

export const metadata = { title: 'About — SU Electrical and Electronic Club' };

export default async function AboutEeeClubPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const row = await prisma.aboutEeeClub.findUnique({ where: { id: 'singleton' } });

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">About — SU Electrical and Electronic Club</h1>
        <p className="mt-1 text-sm text-gray-500">
          Hero, intro, stats, activities, and network section for <code className="font-mono">/about/eee-club</code>.
        </p>
      </header>
      <AboutEeeClubForm initial={row} />
    </div>
  );
}
