import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import ResearchPaperForm from '../ResearchPaperForm';

export const metadata = { title: 'New research paper' };

export default async function NewResearchPaperPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add research paper</h1>
        <p className="mt-1 text-sm text-gray-500">New publication for <code className="font-mono">/research</code>.</p>
      </header>
      <ResearchPaperForm initial={null} />
    </div>
  );
}
