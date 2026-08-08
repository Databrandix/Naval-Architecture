import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, Pencil } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import { RoleBadge } from '@/components/admin/Sidebar';

export const metadata = { title: 'Manage Admins' };

export default async function UsersPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const role = (session.user.role ?? 'admin') as 'super_admin' | 'admin';

  if (role !== 'super_admin') {
    return (
      <div className="max-w-3xl bg-white rounded-lg border border-red-200 p-6">
        <h1 className="text-xl font-display font-bold text-red-700">
          Access denied
        </h1>
        <p className="mt-2 text-sm text-gray-700">
          The “Manage Admins” area is restricted to <strong>super_admin</strong>{' '}
          users. Your account has the <code>admin</code> role.
        </p>
      </div>
    );
  }

  const users = await prisma.user.findMany({
    orderBy: [{ role: 'desc' }, { createdAt: 'asc' }],
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

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Manage Admins</h1>
          <p className="mt-1 text-sm text-gray-500">
            {users.length} admin{users.length === 1 ? '' : 's'} ·{' '}
            <span className="font-medium text-gray-700">
              {users.filter((u) => u.role === 'super_admin' && u.isActive).length}
            </span>{' '}
            active super_admin{users.filter((u) => u.role === 'super_admin' && u.isActive).length === 1 ? '' : 's'}
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          <Plus size={16} /> Add admin
        </Link>
      </header>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <Th>User</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th>Last login</Th>
              <Th className="w-16 text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                <Td>
                  <div className="font-medium text-gray-900">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </Td>
                <Td><RoleBadge role={u.role as 'super_admin' | 'admin'} /></Td>
                <Td>
                  {u.isActive ? (
                    <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
                      Inactive
                    </span>
                  )}
                </Td>
                <Td className="text-xs text-gray-500">
                  {u.lastLoginAt
                    ? new Date(u.lastLoginAt).toLocaleString()
                    : <span className="italic">Never</span>}
                </Td>
                <Td className="text-right">
                  <Link
                    href={`/admin/users/${u.id}`}
                    aria-label={`Edit ${u.name}`}
                    className="inline-flex p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
                  >
                    <Pencil size={16} />
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 ${className}`}
    >
      {children}
    </th>
  );
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}
