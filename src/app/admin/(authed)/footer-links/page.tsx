import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import FooterLinksAdmin from './FooterLinksAdmin';

export const metadata = { title: 'Footer Links' };

export default async function FooterLinksPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const [usefulLinks, getInTouchLinks, quickLinks, legalLinks, campusLinks] = await Promise.all([
    prisma.footerUsefulLink.findMany({ orderBy: { displayOrder: 'asc' } }),
    prisma.footerGetInTouchLink.findMany({ orderBy: { displayOrder: 'asc' } }),
    prisma.footerQuickLink.findMany({ orderBy: { displayOrder: 'asc' } }),
    prisma.footerLegalLink.findMany({ orderBy: { displayOrder: 'asc' } }),
    prisma.footerCampusLink.findMany({ orderBy: { displayOrder: 'asc' } }),
  ]);

  return (
    <div className="space-y-6 max-w-4xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Footer Links</h1>
        <p className="mt-1 text-sm text-gray-500">
          Five link columns rendered in the site footer.
        </p>
      </header>

      <FooterLinksAdmin
        usefulLinks={usefulLinks}
        getInTouchLinks={getInTouchLinks}
        quickLinks={quickLinks}
        legalLinks={legalLinks}
        campusLinks={campusLinks}
      />
    </div>
  );
}
