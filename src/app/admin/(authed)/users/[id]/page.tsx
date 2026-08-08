import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { RoleBadge } from '@/components/admin/Sidebar';
import EditUserForm from '../EditUserForm';
import ResetPasswordCard from '../ResetPasswordCard';
import DeleteUserButton from '../DeleteUserButton';

export const metadata = { title: 'Edit admin' };

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const role = (session.user.role ?? 'admin') as 'super_admin' | 'admin';
  if (role !== 'super_admin') {
    return (
      <div className="max-w-3xl bg-white rounded-lg border border-red-200 p-6">
        <h1 className="text-xl font-display font-bold text-red-700">Access denied</h1>
        <p className="mt-2 text-sm text-gray-700">
          Editing admins is restricted to <strong>super_admin</strong> users.
        </p>
      </div>
    );
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
  if (!user) notFound();

  const isSelf = user.id === session.user.id;

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">{user.name}</h1>
        <div className="mt-2 flex items-center gap-3">
          <RoleBadge role={user.role as 'super_admin' | 'admin'} />
          <span className="text-sm text-gray-500">{user.email}</span>
          {isSelf && (
            <span className="text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
              you
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Joined {new Date(user.createdAt).toLocaleDateString()}
          {user.lastLoginAt && (
            <> · Last login {new Date(user.lastLoginAt).toLocaleString()}</>
          )}
        </p>
      </header>

      <EditUserForm
        initial={{
          id: user.id,
          name: user.name,
          role: user.role as 'super_admin' | 'admin',
          isActive: user.isActive,
        }}
        isSelf={isSelf}
      />

      <ResetPasswordCard userId={user.id} userName={user.name} />

      <DangerZone>
        <DeleteUserButton userId={user.id} userName={user.name} isSelf={isSelf} />
      </DangerZone>

      <Link href="/admin/users"
            className="inline-block text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors">
        ← Back to list
      </Link>
    </div>
  );
}

function DangerZone({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-white border border-red-200 rounded-lg p-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-red-700">
          Danger zone
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Deletion is permanent. Cascades to remove sessions and the credential
          account. Blocked if this is the last active super_admin.
        </p>
      </div>
      {children}
    </section>
  );
}
