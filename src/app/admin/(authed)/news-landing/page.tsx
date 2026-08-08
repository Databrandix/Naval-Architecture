import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import NewsLandingForm from './NewsLandingForm';

export const metadata = { title: 'News — Landing Page' };

export default async function NewsLandingPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const row = await prisma.newsLanding.findUnique({ where: { id: 'singleton' } });

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          News — Landing Page
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Hero + intro content for the public <code className="font-mono">/news</code> listing page.
          Individual articles are managed under <code className="font-mono">News</code> in the same group.
        </p>
      </header>
      <NewsLandingForm initial={row} />
    </div>
  );
}
