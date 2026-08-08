'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, Download, FlaskConical, Table2 } from 'lucide-react';

/**
 * Course structure and credit distribution for a program.
 *
 * Eight semesters of sixty-odd courses is too much to show open at once, so
 * each semester is a disclosure and the first year opens by default — enough
 * to make it obvious the rest expand, without a wall of table on arrival.
 *
 * The shapes here mirror the Json columns on ProgramCurriculum. They are
 * validated at the boundary (see coerceSemesters / coerceCreditRows on the
 * page) rather than trusted, because Json columns carry whatever was written
 * to them.
 */

export type Course = {
  code: string;
  title: string;
  type: string;
  credits: number | null;
  prerequisite: string | null;
  remarks: string | null;
};

export type Semester = { name: string; courses: Course[] };

export type CreditRow = {
  semester: string;
  total: number | null;
  core: number | null;
  elective: number | null;
  lab: number | null;
  project: number | null;
  cumulative: number | null;
};

function creditsOf(courses: Course[]): number {
  return courses.reduce((sum, c) => sum + (c.credits ?? 0), 0);
}

/** Trailing zeros read as false precision on a credit count: 19.5, but 20. */
function formatCredits(value: number | null): string {
  if (value === null) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function isSessional(course: Course): boolean {
  return /sessional|lab/i.test(`${course.remarks ?? ''} ${course.title}`);
}

function SemesterPanel({ semester, defaultOpen }: { semester: Semester; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `semester-${semester.name.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="bg-primary/5 text-primary inline-flex size-9 shrink-0 items-center justify-center rounded-lg">
            <BookOpen size={17} strokeWidth={1.75} />
          </span>
          <span className="min-w-0">
            <span className="text-primary block truncate font-display text-[15px] font-bold">
              {semester.name}
            </span>
            <span className="block text-xs text-gray-500">
              {semester.courses.length} courses · {formatCredits(creditsOf(semester.courses))} credits
            </span>
          </span>
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && (
        <div id={panelId} className="overflow-x-auto border-t border-gray-100">
          <table className="w-full min-w-[34rem] text-left text-[14px]">
            <thead>
              <tr className="bg-gray-50 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                <th scope="col" className="px-5 py-2.5">Code</th>
                <th scope="col" className="px-5 py-2.5">Course</th>
                <th scope="col" className="px-5 py-2.5 text-right">Credits</th>
              </tr>
            </thead>
            <tbody>
              {semester.courses.map((course) => (
                <tr key={course.code} className="border-t border-gray-100">
                  <td className="text-primary px-5 py-3 font-mono text-[13px] whitespace-nowrap">
                    {course.code}
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-medium text-gray-800">{course.title}</span>
                    {isSessional(course) && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 align-middle text-[10px] font-semibold text-accent">
                        <FlaskConical size={10} aria-hidden />
                        Sessional
                      </span>
                    )}
                    {course.prerequisite && (
                      <span className="mt-0.5 block text-xs text-gray-500">
                        Prerequisite: {course.prerequisite}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-700 tabular-nums">
                    {formatCredits(course.credits)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function CurriculumSection({
  semesters,
  creditRows,
  pdfUrl,
  pdfFileName,
}: {
  semesters: Semester[];
  creditRows: CreditRow[];
  pdfUrl: string | null;
  pdfFileName: string | null;
}) {
  if (semesters.length === 0 && creditRows.length === 0) return null;

  const totalCourses = semesters.reduce((n, s) => n + s.courses.length, 0);

  return (
    <section className="mb-16 md:mb-20">
      <h3 className="text-primary mb-2 text-center font-display text-xl font-bold md:text-2xl">
        Course Structure
      </h3>
      <p className="mx-auto mb-8 max-w-2xl text-center text-[15px] text-gray-600">
        {totalCourses} courses across {semesters.length} semesters. Select a semester to see its
        courses.
      </p>

      <div className="mx-auto flex max-w-4xl flex-col gap-3">
        {semesters.map((semester, index) => (
          <SemesterPanel key={semester.name} semester={semester} defaultOpen={index === 0} />
        ))}
      </div>

      {creditRows.length > 0 && (
        <div className="mx-auto mt-12 max-w-4xl">
          <h3 className="text-primary mb-6 text-center font-display text-xl font-bold md:text-2xl">
            Credit Distribution
          </h3>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full min-w-[40rem] text-left text-[14px]">
              <thead>
                <tr className="bg-gray-50 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                  <th scope="col" className="px-5 py-3">Semester</th>
                  <th scope="col" className="px-5 py-3 text-right">Core</th>
                  <th scope="col" className="px-5 py-3 text-right">Elective</th>
                  <th scope="col" className="px-5 py-3 text-right">Lab</th>
                  <th scope="col" className="px-5 py-3 text-right">Project</th>
                  <th scope="col" className="px-5 py-3 text-right">Total</th>
                  <th scope="col" className="px-5 py-3 text-right">Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {creditRows.map((row) => (
                  <tr key={row.semester} className="border-t border-gray-100">
                    <td className="px-5 py-3 font-medium text-gray-800">{row.semester}</td>
                    <td className="px-5 py-3 text-right text-gray-600 tabular-nums">{formatCredits(row.core)}</td>
                    <td className="px-5 py-3 text-right text-gray-600 tabular-nums">{formatCredits(row.elective)}</td>
                    <td className="px-5 py-3 text-right text-gray-600 tabular-nums">{formatCredits(row.lab)}</td>
                    <td className="px-5 py-3 text-right text-gray-600 tabular-nums">{formatCredits(row.project)}</td>
                    <td className="text-primary px-5 py-3 text-right font-bold tabular-nums">{formatCredits(row.total)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-700 tabular-nums">{formatCredits(row.cumulative)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pdfUrl && (
        <div className="mx-auto mt-10 max-w-4xl">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white p-7 text-center shadow-sm sm:flex-row sm:text-left">
            <span className="from-primary to-accent inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md">
              <Table2 size={22} strokeWidth={1.75} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-primary font-display text-[15px] font-bold">
                Course structure and credit distribution
              </p>
              <p className="text-sm text-gray-500">
                The tables on this page, as a PDF you can keep.
              </p>
            </div>
            <a
              href={pdfUrl}
              download={pdfFileName ?? undefined}
              className="bg-primary hover:bg-primary/90 inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold text-white shadow-md transition-colors"
            >
              <Download size={17} aria-hidden />
              Download PDF
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
