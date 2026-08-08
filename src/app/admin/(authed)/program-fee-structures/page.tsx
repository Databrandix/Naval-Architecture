import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';

export const metadata = { title: 'Program Fee Structures (CMS)' };

export default async function ProgramFeeStructuresAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const programs = await prisma.program.findMany({
    orderBy: { displayOrder: 'asc' },
    select: {
      id: true,
      programName: true,
      degreeCode: true,
      feeStructure: { select: { id: true, updatedAt: true } },
    },
  });

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Program Fee Structures</h1>
        <p className="mt-1 text-sm text-gray-500">
          One fee structure per Program. Renders on <code className="font-mono">/admission/tuition-fees</code>. Programs without a configured fee structure are hidden from the public page.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Programs</h2>
        {programs.length === 0 ? (
          <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500 text-sm">No programs in the system yet.</p>
            <Link href="/admin/programs/new" className="text-accent hover:underline font-medium text-sm mt-2 inline-block">
              Add a program first
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {programs.map((p) => {
              const configured = !!p.feeStructure;
              return (
                <li key={p.id}>
                  <Link
                    href={`/admin/program-fee-structures/${p.id}`}
                    className="group flex items-center justify-between gap-4 bg-white border border-gray-200 rounded-lg px-5 py-4 hover:border-accent hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent/40"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {configured ? (
                        <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Circle size={20} className="text-gray-300 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 text-sm">{p.programName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          <code className="font-mono">{p.degreeCode}</code>
                          {' · '}
                          {configured
                            ? <>Configured · last updated {new Date(p.feeStructure!.updatedAt).toLocaleDateString()}</>
                            : <span className="text-amber-600 font-medium">Not configured</span>}
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-gray-300 group-hover:text-accent group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
