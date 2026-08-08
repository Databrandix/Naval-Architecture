import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import WaiverScholarshipLandingForm from './WaiverScholarshipLandingForm';

export const metadata = { title: 'Waiver/Scholarship Landing (CMS)' };

export default async function WaiverScholarshipLandingAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const item = await prisma.waiverScholarshipLanding.findUnique({ where: { id: 'singleton' } });

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Waiver / Scholarship Landing</h1>
        <p className="mt-1 text-sm text-gray-500">
          Page chrome for <code className="font-mono">/admission/waiver-scholarship</code> — intro, Part 01 / Part 02 headings, summary table, key takeaways. Waiver categories themselves are edited via <a href="/admin/waiver-categories" className="text-accent hover:underline">Waiver Categories</a>; merit slabs via <a href="/admin/scholarships" className="text-accent hover:underline">Scholarships</a>.
        </p>
      </header>
      <WaiverScholarshipLandingForm initial={item} />
    </div>
  );
}
