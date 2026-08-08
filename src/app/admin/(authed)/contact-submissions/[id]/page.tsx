import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Globe, Clock, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import StatusActions from './StatusActions';

export const metadata = { title: 'Contact Submission · Detail' };

export default async function ContactSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;
  const item = await prisma.contactSubmission.findUnique({ where: { id } });
  if (!item) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href={`/admin/contact-submissions${item.status === 'new' ? '' : `?status=${item.status}`}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-accent transition-colors"
      >
        <ArrowLeft size={14} /> Back to {item.status} submissions
      </Link>

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <StatusBadge status={item.status} />
          <span className="text-xs text-gray-400">
            Submitted {new Date(item.submittedAt).toLocaleString()}
          </span>
        </div>
        <h1 className="text-2xl font-display font-bold text-gray-900">{item.name}</h1>
      </header>

      <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <FieldRow icon={Mail} label="Email">
          <a href={`mailto:${item.email}`} className="text-accent hover:underline break-all">
            {item.email}
          </a>
        </FieldRow>
        {item.phone && (
          <FieldRow icon={Phone} label="Phone">
            <a href={`tel:${item.phone}`} className="text-primary hover:text-accent transition-colors">
              {item.phone}
            </a>
          </FieldRow>
        )}
        {item.subject && (
          <FieldRow icon={Globe} label="Subject">
            <span className="text-gray-900">{item.subject}</span>
          </FieldRow>
        )}

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Message</div>
          <div className="bg-gray-50 border border-gray-100 rounded-md px-4 py-3 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {item.message}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-6 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Audit</h2>
        <FieldRow icon={Clock} label="Submitted">
          <span className="text-gray-700 text-sm">{new Date(item.submittedAt).toISOString()}</span>
        </FieldRow>
        {item.ipAddress && (
          <FieldRow icon={MapPin} label="IP">
            <span className="font-mono text-xs text-gray-700">{item.ipAddress}</span>
          </FieldRow>
        )}
        {item.userAgent && (
          <FieldRow icon={Globe} label="User-Agent">
            <span className="font-mono text-[11px] text-gray-600 break-all">{item.userAgent}</span>
          </FieldRow>
        )}
        <FieldRow
          icon={item.emailSentAt ? CheckCircle2 : AlertCircle}
          label="Email dispatch"
        >
          {item.emailSentAt ? (
            <span className="text-emerald-700 text-sm">
              ✓ Sent at {new Date(item.emailSentAt).toLocaleString()}
            </span>
          ) : item.emailError ? (
            <span className="text-amber-700 text-sm">{item.emailError}</span>
          ) : (
            <span className="text-gray-500 text-sm">No dispatch attempted</span>
          )}
        </FieldRow>
      </section>

      <StatusActions id={item.id} currentStatus={item.status} />
    </div>
  );
}

function FieldRow({
  icon: Icon, label, children,
}: {
  icon: typeof Mail;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} className="shrink-0 mt-0.5 text-gray-400" />
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-0.5">{label}</div>
        <div>{children}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    new:      { label: 'New',      cls: 'bg-blue-100 text-blue-700' },
    read:     { label: 'Read',     cls: 'bg-emerald-100 text-emerald-700' },
    archived: { label: 'Archived', cls: 'bg-gray-100 text-gray-600' },
  };
  const c = cfg[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${c.cls}`}>
      {c.label}
    </span>
  );
}
