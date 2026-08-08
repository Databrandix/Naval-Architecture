import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import ResearchPaperForm from '../ResearchPaperForm';

export const metadata = { title: 'Edit research paper' };

export default async function EditResearchPaperPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;
  const paper = await prisma.researchPaper.findUnique({ where: { id } });
  if (!paper) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Edit research paper</h1>
        <p className="mt-1 text-sm text-gray-500 line-clamp-1">{paper.title}</p>
      </header>
      <ResearchPaperForm initial={paper} />
    </div>
  );
}
