import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import CreateUserForm from '../CreateUserForm';

export const metadata = { title: 'Add admin' };

export default async function NewUserPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const role = (session.user.role ?? 'admin') as 'super_admin' | 'admin';
  if (role !== 'super_admin') {
    return (
      <div className="max-w-3xl bg-white rounded-lg border border-red-200 p-6">
        <h1 className="text-xl font-display font-bold text-red-700">Access denied</h1>
        <p className="mt-2 text-sm text-gray-700">
          Adding admins is restricted to <strong>super_admin</strong> users.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add an admin</h1>
        <p className="mt-1 text-sm text-gray-500">
          The new user can sign in immediately with the password you set here.
          They can change it themselves via Change Password after first sign-in.
        </p>
      </header>
      <CreateUserForm />
    </div>
  );
}
