import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import AdmissionTransferCreditsForm from './AdmissionTransferCreditsForm';

export const metadata = { title: 'Admission Transfer Credits (CMS)' };

export default async function AdmissionTransferCreditsAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const item = await prisma.admissionTransferCredits.findUnique({ where: { id: 'singleton' } });

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Transfer Credits</h1>
        <p className="mt-1 text-sm text-gray-500">
          University-wide credit transfer policy for <code className="font-mono">/admission/transfer-credits</code>. Single page, no per-program differentiation.
        </p>
      </header>
      <AdmissionTransferCreditsForm initial={item} />
    </div>
  );
}
