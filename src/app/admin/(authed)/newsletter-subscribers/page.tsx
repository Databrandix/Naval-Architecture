import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import SubscribersList from './SubscribersList';

export const metadata = { title: 'Newsletter — Subscribers' };

export default async function NewsletterSubscribersPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const subscribers = await prisma.newsletterSubscriber.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      status: true,
      source: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Newsletter — Subscribers
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Emails submitted via the public <code className="font-mono">/newsletter</code>{' '}
          page. {subscribers.length} subscriber{subscribers.length === 1 ? '' : 's'}.
        </p>
      </header>

      <SubscribersList
        items={subscribers.map((s) => ({
          id: s.id,
          email: s.email,
          status: s.status,
          source: s.source,
          createdAt: s.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
