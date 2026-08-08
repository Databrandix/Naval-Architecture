import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronRight, Image as ImageIcon } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';

export const metadata = { title: 'Page Heroes' };

export default async function PageHeroesAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const rows = await prisma.pageHero.findMany({
    orderBy: { pageLabel: 'asc' },
    select: {
      id: true,
      pageKey: true,
      pageLabel: true,
      publicPath: true,
      heroTitle: true,
      heroImageUrl: true,
    },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Page Heroes</h1>
        <p className="mt-1 text-sm text-gray-500">
          Hero image + title for every public page that doesn&apos;t already have
          its own CMS singleton. Edit each row independently so admission /
          student-society / etc. pages can show different banners.
        </p>
      </header>

      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              href={`/admin/page-heroes/${row.id}`}
              className="group flex items-center justify-between gap-4 bg-white border border-gray-200 hover:border-accent/50 hover:shadow-sm rounded-lg p-3 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-16 h-12 rounded bg-gray-50 border border-gray-200 overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={row.heroImageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-gray-900 truncate">{row.pageLabel}</div>
                  <div className="text-xs text-gray-500 truncate font-mono">
                    {row.publicPath}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-gray-400 group-hover:text-accent transition-colors">
                <span className="hidden sm:inline text-xs font-medium">{row.heroTitle}</span>
                <ChevronRight size={16} />
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {rows.length === 0 && (
        <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
          <ImageIcon size={24} className="text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">
            No page heroes seeded. Run the migration.
          </p>
        </div>
      )}
    </div>
  );
}
