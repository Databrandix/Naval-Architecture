import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import CurriculumAdminForms from './CurriculumAdminForms';

export const metadata = { title: 'Course curriculum (CMS)' };

type Course = { code?: unknown; title?: unknown; credits?: unknown };
type Semester = { name?: unknown; courses?: unknown };

/** Enough of the Json to summarise it; the page never edits courses by hand. */
function summarise(semesters: unknown) {
  if (!Array.isArray(semesters)) return [];
  return (semesters as Semester[]).map((s) => {
    const courses = Array.isArray(s?.courses) ? (s.courses as Course[]) : [];
    return {
      name: typeof s?.name === 'string' ? s.name : 'Untitled semester',
      count: courses.length,
      credits: courses.reduce(
        (n, c) => n + (typeof c?.credits === 'number' ? c.credits : 0),
        0,
      ),
    };
  });
}

export default async function ProgramCurriculumDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { slug } = await params;

  const program = await prisma.program.findFirst({
    where: { degreeCode: { equals: slug, mode: 'insensitive' } },
    select: { programName: true, degreeCode: true, curriculum: true },
  });
  if (!program) notFound();

  const semesters = summarise(program.curriculum?.semesters);
  const creditRows = Array.isArray(program.curriculum?.creditRows)
    ? program.curriculum.creditRows.length
    : 0;
  const publicPath = `/programs/${program.degreeCode.toLowerCase()}`;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <Link
          href="/admin/program-curriculum"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-800"
        >
          <ArrowLeft size={15} /> All programmes
        </Link>
      </div>

      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">{program.programName}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Shown on{' '}
          <Link href={publicPath} className="font-mono underline">
            {publicPath}
          </Link>
        </p>
      </header>

      {semesters.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Currently published
          </h2>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  <th scope="col" className="px-4 py-2.5">Semester</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Courses</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Credits</th>
                </tr>
              </thead>
              <tbody>
                {semesters.map((s) => (
                  <tr key={s.name} className="border-t border-gray-100">
                    <td className="px-4 py-2.5 text-gray-800">{s.name}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">{s.count}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">{s.credits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400">
            {creditRows} credit distribution row{creditRows === 1 ? '' : 's'}.
          </p>
        </section>
      ) : (
        <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
          No curriculum yet. Upload the department&rsquo;s spreadsheet below and the course tables
          will appear on the programme page.
        </p>
      )}

      <CurriculumAdminForms
        slug={program.degreeCode.toLowerCase()}
        hasCurriculum={Boolean(program.curriculum)}
        pdfUrl={program.curriculum?.pdfUrl ?? ''}
        pdfFileName={program.curriculum?.pdfFileName ?? ''}
      />
    </div>
  );
}
