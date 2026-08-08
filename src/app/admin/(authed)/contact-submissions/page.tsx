import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Inbox, Mail, MailCheck, Archive } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';

export const metadata = { title: 'Contact Submissions (CMS)' };

type AllowedStatus = 'new' | 'read' | 'archived';
const ALLOWED: readonly AllowedStatus[] = ['new', 'read', 'archived'] as const;

function isAllowed(v: string | undefined): v is AllowedStatus {
  return v === 'new' || v === 'read' || v === 'archived';
}

const FILTER_LABEL: Record<AllowedStatus, string> = {
  new: 'New',
  read: 'Read',
  archived: 'Archived',
};

const FILTER_ICON: Record<AllowedStatus, typeof Inbox> = {
  new: Inbox,
  read: MailCheck,
  archived: Archive,
};

export default async function ContactSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const sp = await searchParams;
  const filter: AllowedStatus = isAllowed(sp.status) ? sp.status : 'new';

  const [items, countsRaw] = await Promise.all([
    prisma.contactSubmission.findMany({
      where: { status: filter },
      orderBy: { submittedAt: 'desc' },
      take: 100,
    }),
    prisma.contactSubmission.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
  ]);

  const counts: Record<AllowedStatus, number> = { new: 0, read: 0, archived: 0 };
  for (const row of countsRaw) {
    if (isAllowed(row.status)) counts[row.status] = row._count._all;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Contact Submissions
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Form submissions from <code className="font-mono">/contact</code>. Mark them as read once you have responded; archive when no further action is needed.
        </p>
      </header>

      <nav className="flex flex-wrap gap-2">
        {ALLOWED.map((s) => {
          const Icon = FILTER_ICON[s];
          const active = filter === s;
          return (
            <Link
              key={s}
              href={s === 'new' ? '/admin/contact-submissions' : `/admin/contact-submissions?status=${s}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                active
                  ? 'bg-accent text-white border-accent'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-accent hover:text-accent'
              }`}
            >
              <Icon size={14} />
              {FILTER_LABEL[s]}
              <span className={`ml-1 inline-flex items-center justify-center min-w-[1.25rem] px-1.5 text-[11px] font-bold rounded-full ${
                active ? 'bg-white text-accent' : 'bg-gray-100 text-gray-600'
              }`}>
                {counts[s]}
              </span>
            </Link>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
          <Mail size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 text-sm">No {FILTER_LABEL[filter].toLowerCase()} submissions.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((s) => (
            <li key={s.id}>
              <Link
                href={`/admin/contact-submissions/${s.id}`}
                className="block bg-white rounded-lg border border-gray-200 hover:border-accent hover:shadow-sm transition-all p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-900 truncate">{s.name}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500 truncate">{s.email}</span>
                    </div>
                    {s.subject && (
                      <div className="text-sm text-gray-700 truncate">{s.subject}</div>
                    )}
                    <p className="mt-1 text-xs text-gray-500 line-clamp-1">{s.message}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-gray-500">
                      {new Date(s.submittedAt).toLocaleString(undefined, {
                        month: 'short', day: 'numeric',
                        hour: 'numeric', minute: '2-digit',
                      })}
                    </div>
                    {s.emailSentAt ? (
                      <div className="text-[10px] text-emerald-600 mt-0.5">✓ emailed</div>
                    ) : s.emailError ? (
                      <div className="text-[10px] text-amber-600 mt-0.5">email skipped</div>
                    ) : null}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
