import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import FaqsList from './FaqsList';

export const metadata = { title: 'FAQs (CMS)' };

export default async function FaqsAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const faqs = await prisma.faq.findMany({ orderBy: { displayOrder: 'asc' } });

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">FAQs</h1>
        <p className="mt-1 text-sm text-gray-500">
          Q&amp;A pairs for <code className="font-mono">/student-society/faq</code>. Drag to reorder; the public page groups by category.
        </p>
      </header>
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">FAQs</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {faqs.length} FAQ{faqs.length === 1 ? '' : 's'}{faqs.length > 1 && ' · drag to reorder'}
            </p>
          </div>
          <Link href="/admin/faqs/new"
                className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40">
            <Plus size={16} /> Add FAQ
          </Link>
        </div>
        <FaqsList items={faqs} />
      </section>
    </div>
  );
}
