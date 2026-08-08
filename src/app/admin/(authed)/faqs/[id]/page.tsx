import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import FaqForm from '../FaqForm';

export const metadata = { title: 'Edit FAQ' };

export default async function EditFaqPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;
  const faq = await prisma.faq.findUnique({ where: { id } });
  if (!faq) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Edit FAQ <span className="text-accent">— {faq.category}</span>
        </h1>
        <p className="mt-1 text-sm text-gray-500 line-clamp-1">
          {faq.question}
        </p>
      </header>
      <FaqForm initial={faq} />
    </div>
  );
}
