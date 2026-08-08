import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import NewsletterForm from './NewsletterForm';

export const metadata = { title: 'Newsletter — Page' };

export default async function NewsletterAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const row = await prisma.newsletterPage.findUnique({ where: { id: 'singleton' } });

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Newsletter — Page
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Hero, intro, advantages, and signup form labels for the public{' '}
          <code className="font-mono">/newsletter</code> page. Subscribers themselves
          live under <code className="font-mono">Newsletter Subscribers</code> in the
          same group.
        </p>
      </header>
      <NewsletterForm initial={row} />
    </div>
  );
}
