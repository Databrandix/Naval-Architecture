import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import AdmissionRequirementsForm from './AdmissionRequirementsForm';

export const metadata = { title: 'Admission Requirements (CMS)' };

export default async function AdmissionRequirementsAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const item = await prisma.admissionRequirements.findUnique({ where: { id: 'singleton' } });

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Admission Requirements</h1>
        <p className="mt-1 text-sm text-gray-500">
          University-wide admission policy for <code className="font-mono">/admission/requirements</code>. Single page, no per-program differentiation.
        </p>
      </header>
      <AdmissionRequirementsForm initial={item} />
    </div>
  );
}
