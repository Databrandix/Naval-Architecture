import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';

export const metadata = { title: 'Course curriculum (CMS)' };

type SemesterShape = { courses?: unknown[] };

function courseCount(semesters: unknown): number {
  if (!Array.isArray(semesters)) return 0;
  return (semesters as SemesterShape[]).reduce(
    (n, s) => n + (Array.isArray(s?.courses) ? s.courses.length : 0),
    0,
  );
}

export default async function ProgramCurriculumAdminPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const programs = await prisma.program.findMany({
    orderBy: { displayOrder: 'asc' },
    select: { id: true, programName: true, degreeCode: true, curriculum: true },
  });

  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Course curriculum</h1>
        <p className="mt-1 text-sm text-gray-500">
          The course structure and credit distribution shown on each programme page, and the PDF
          offered beneath them.
        </p>
      </header>

      <section className="space-y-3">
        {programs.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            No programmes yet — add one under <Link href="/admin/programs" className="underline">Programs</Link> first.
          </p>
        )}

        {programs.map((program) => {
          const slug = program.degreeCode.toLowerCase();
          const courses = courseCount(program.curriculum?.semesters);
          const semesters = Array.isArray(program.curriculum?.semesters)
            ? program.curriculum.semesters.length
            : 0;

          return (
            <Link
              key={program.id}
              href={`/admin/program-curriculum/${slug}`}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-accent/40 hover:bg-gray-50"
            >
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
                <BookOpen size={18} strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-gray-900">
                  {program.programName}
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  {program.curriculum
                    ? `${courses} courses · ${semesters} semesters${program.curriculum.pdfUrl ? ' · PDF attached' : ' · no PDF'}`
                    : 'No curriculum uploaded yet'}
                </span>
              </span>
              <ChevronRight size={16} className="shrink-0 text-gray-400" aria-hidden />
            </Link>
          );
        })}
      </section>
    </div>
  );
}
