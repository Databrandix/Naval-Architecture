import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import { prisma } from '@/lib/db';
import Sidebar from '@/components/admin/Sidebar';
import { ConfirmDialogProvider } from '@/components/admin/ConfirmDialogProvider';
import { getDepartmentIdentity, getUniversityIdentity } from '@/lib/identity';

export default async function AuthedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Phase 16 CP16.NEW — parallelize the session lookup with the
  // identity + count fetches. Pre-fix this ran getSession() first
  // (blocking ~270ms cross-region) and only then started the
  // Promise.all (~270ms). Now all four run together for one
  // batched ~270ms wait. Safe because middleware already cookie-
  // gates /admin/* before we reach this layout, so the "no session"
  // branch is rare (expired token, race) and the few wasted-compute
  // queries when it does fire don't add wall time (they're already
  // in flight). Redirect still short-circuits before rendering the
  // sidebar.
  //
  // Sidebar header — DB-driven SU brand banner (same asset the
  // public Navbar uses on white background). The login card uses the
  // compact crest hardcoded at /assets/su-logo.png instead — chair's
  // call after seeing both placements: banner reads as ambient brand
  // presence in the sidebar, while the login moment wants the focused
  // compact mark.
  const [session, newSubmissionCount, dept, uni] = await Promise.all([
    getSession(),
    prisma.contactSubmission.count({ where: { status: 'new' } }),
    getDepartmentIdentity(),
    getUniversityIdentity(),
  ]);

  if (!session?.user) {
    redirect('/admin/login');
  }

  const role = (session.user.role ?? 'admin') as 'super_admin' | 'admin';

  return (
    // lg:flex restores side-by-side layout on desktop; <lg the Sidebar
    // takes itself out of flow (position: fixed) so <main> fills the
    // viewport width. min-w-0 on main is needed so flex children with
    // long content (tables, code blocks) don't push past the column.
    //
    // ConfirmDialogProvider wraps everything so both the Sidebar's
    // logout dialog and any list/form deeper in the tree can call
    // useConfirm() without per-route plumbing.
    <ConfirmDialogProvider>
      <div className="min-h-screen lg:flex bg-gray-50">
        <Sidebar
          user={{
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            role,
          }}
          newSubmissionCount={newSubmissionCount}
          logoUrl={dept.logoUrl}
          logoAlt={`${uni.name} logo`}
        />
        <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 lg:p-10 max-w-screen-2xl pt-16 lg:pt-10">
          {children}
        </main>
      </div>
    </ConfirmDialogProvider>
  );
}
