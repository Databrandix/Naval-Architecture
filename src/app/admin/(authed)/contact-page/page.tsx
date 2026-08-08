import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import ContactPageForm from './ContactPageForm';

export const metadata = { title: 'Contact Page' };

export default async function ContactPageAdmin() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const row = await prisma.contactPageContent.findUnique({ where: { id: 'singleton' } });

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Contact Page</h1>
        <p className="mt-1 text-sm text-gray-500">
          Hero · intro · section headings · 4 Quick Contact cards · form copy for <code className="font-mono">/contact</code>. The contact submission backend (Phase 9) is separate; this is page chrome + content only.
        </p>
      </header>
      <ContactPageForm initial={row} />
    </div>
  );
}
