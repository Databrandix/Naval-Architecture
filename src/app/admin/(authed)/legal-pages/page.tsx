import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import LegalPagesForm from './LegalPagesForm';

export const metadata = { title: 'Legal Pages' };

export default async function LegalPagesAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const row = await prisma.legalPagesContent.findUnique({
    where: { id: 'singleton' },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Legal Pages
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Privacy Policy (/privacy-policy) and Terms &amp; Conditions
          (/terms-and-conditions). One combined form; both bodies accept
          inline HTML (<code>&lt;h2&gt;</code>, <code>&lt;p&gt;</code>,
          <code>&lt;ul&gt;</code>/<code>&lt;li&gt;</code>,{' '}
          <code>&lt;strong&gt;</code>, <code>&lt;a&gt;</code>).
        </p>
      </header>
      <LegalPagesForm initial={row} />
    </div>
  );
}
