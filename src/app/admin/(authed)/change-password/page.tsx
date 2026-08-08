import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import { RoleBadge } from '@/components/admin/Sidebar';
import ChangePasswordForm from './ChangePasswordForm';

export const metadata = { title: 'Change Password' };

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const role = (session.user.role ?? 'admin') as 'super_admin' | 'admin';

  return (
    <div className="space-y-6 max-w-md">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Change my password
        </h1>
        <div className="mt-2 flex items-center gap-3">
          <RoleBadge role={role} />
          <span className="text-sm text-gray-500">{session.user.email}</span>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          You will stay signed in on this device after a successful change.
        </p>
      </header>
      <ChangePasswordForm />
    </div>
  );
}
