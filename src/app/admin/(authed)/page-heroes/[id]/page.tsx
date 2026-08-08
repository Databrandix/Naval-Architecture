import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import PageHeroForm from './PageHeroForm';

export const metadata = { title: 'Edit Page Hero' };

export default async function EditPageHeroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;
  const row = await prisma.pageHero.findUnique({ where: { id } });
  if (!row) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">
              {row.pageLabel}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Hero shown at the top of <code className="font-mono">{row.publicPath}</code>.
            </p>
          </div>
          <a
            href={row.publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            View page
            <ExternalLink size={14} />
          </a>
        </div>
        <div className="mt-3">
          <Link
            href="/admin/page-heroes"
            className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← All page heroes
          </Link>
        </div>
      </header>

      <PageHeroForm initial={row} />
    </div>
  );
}
