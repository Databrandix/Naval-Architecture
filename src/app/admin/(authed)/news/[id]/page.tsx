import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import NewsForm from '../NewsForm';

type Params = { id: string };

export const metadata = { title: 'Edit news article' };

export default async function EditNewsPage({ params }: { params: Promise<Params> }) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;
  const article = await prisma.news.findUnique({ where: { id } });
  if (!article) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Edit article: <span className="text-accent">{article.shortTitle}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          URL: <code className="font-mono">/news/{article.slug}</code>
        </p>
      </header>
      <NewsForm initial={article} />
    </div>
  );
}
