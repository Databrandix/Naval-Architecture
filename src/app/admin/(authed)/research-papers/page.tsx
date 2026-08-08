import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import ResearchPapersList from './ResearchPapersList';

export const metadata = { title: 'Research Papers (CMS)' };

export default async function ResearchPapersAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const papers = await prisma.researchPaper.findMany({ orderBy: { displayOrder: 'asc' } });

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Research Papers</h1>
        <p className="mt-1 text-sm text-gray-500">
          Publications for <code className="font-mono">/research</code>. Drag to reorder.
        </p>
      </header>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Papers</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {papers.length} paper{papers.length === 1 ? '' : 's'}{papers.length > 1 && ' · drag to reorder'}
            </p>
          </div>
          <Link href="/admin/research-papers/new"
                className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40">
            <Plus size={16} /> Add paper
          </Link>
        </div>
        <ResearchPapersList items={papers} />
      </section>
    </div>
  );
}
