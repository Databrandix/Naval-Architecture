import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import ApplicationsList from './ApplicationsList';

export const metadata = { title: 'SUEEC — Applications' };

export default async function DepartmentClubApplicationsPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const applications = await prisma.departmentClubApplication.findMany({
    orderBy: { submittedAt: 'desc' },
  });

  const pendingCount = applications.filter((a) => a.status === 'pending').length;

  return (
    <div className="space-y-6 max-w-5xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          SU Electrical and Electronic Club — Applications
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Join applications submitted via the public{' '}
          <code className="font-mono">/about/club</code> popup form.{' '}
          {applications.length} total
          {pendingCount > 0 ? ` · ${pendingCount} pending review` : ''}.
        </p>
      </header>

      <ApplicationsList
        items={applications.map((a) => ({
          id:          a.id,
          fullName:    a.fullName,
          studentId:   a.studentId,
          email:       a.email,
          phone:       a.phone,
          semester:    a.semester,
          motivation:  a.motivation,
          status:      a.status,
          submittedAt: a.submittedAt.toISOString(),
        }))}
      />
    </div>
  );
}
