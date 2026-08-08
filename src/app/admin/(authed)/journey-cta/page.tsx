import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import JourneyCTAForm from './JourneyCTAForm';

export const metadata = { title: 'Journey CTA' };

export default async function JourneyCTAAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const row = await prisma.journeyCTAContent.findUnique({ where: { id: 'singleton' } });

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Journey CTA</h1>
        <p className="mt-1 text-sm text-gray-500">
          The full-bleed call-to-action section that sits between page content and the footer on every public page. Hero image, heading, body, and two CTA buttons.
        </p>
      </header>
      <JourneyCTAForm initial={row} />
    </div>
  );
}
