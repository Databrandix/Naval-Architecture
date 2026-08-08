import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import NavAdmin from './NavAdmin';

export const metadata = { title: 'Navigation' };

export default async function NavPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const [topLinks, quickAccessItems, mainNavGroups] = await Promise.all([
    prisma.topLink.findMany({ orderBy: { displayOrder: 'asc' } }),
    prisma.quickAccessItem.findMany({ orderBy: { displayOrder: 'asc' } }),
    prisma.mainNavGroup.findMany({
      orderBy: { displayOrder: 'asc' },
      include: { items: { orderBy: { displayOrder: 'asc' } } },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Navigation</h1>
        <p className="mt-1 text-sm text-gray-500">
          Top bar links, quick access grid, and the main nav (with nested items).
        </p>
      </header>

      <NavAdmin
        topLinks={topLinks}
        quickAccessItems={quickAccessItems}
        mainNavGroups={mainNavGroups}
      />
    </div>
  );
}
