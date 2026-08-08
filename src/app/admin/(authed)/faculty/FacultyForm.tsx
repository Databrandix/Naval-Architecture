'use client';

import Link from 'next/link';
import { useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Faculty } from '@prisma/client';
import ImageUploader from '@/components/admin/ImageUploader';
import HeroImagePositionSlider from '@/components/admin/HeroImagePositionSlider';
import PersonalInfoEditor from './PersonalInfoEditor';
import SectionContentEditor from './SectionContentEditor';
import ParagraphsEditor from '@/components/admin/ParagraphsEditor';
import DesignationSelector from './DesignationSelector';
import {
  createFacultyAction,
  updateFacultyAction,
  type ActionResult,
} from '@/lib/admin-actions/faculty';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

type State = ActionResult | { ok: null };

type CurrentRoleHolder = { id: string; name: string } | null;

type Props = {
  initial: Faculty | null;
  currentDean: CurrentRoleHolder;
  currentHead: CurrentRoleHolder;
};

const SECTION_FIELDS = [
  { name: 'academicQualification', label: 'Academic Qualification' },
  { name: 'trainingExperience',    label: 'Training Experience' },
  { name: 'teachingArea',          label: 'Teaching Area' },
  { name: 'publications',          label: 'Publication' },
  { name: 'research',              label: 'Research' },
  { name: 'awards',                label: 'Award & Scholarship' },
  { name: 'membership',            label: 'Membership' },
  { name: 'previousEmployment',    label: 'Previous Employment' },
] as const;

export default function FacultyForm({ initial, currentDean, currentHead }: Props) {
  const isEdit = !!initial;
  const action = isEdit
    ? updateFacultyAction.bind(null, initial!.id)
    : createFacultyAction;

  const [state, formAction, pending] = useActionState<State, FormData>(
    action,
    { ok: null },
  );
  const confirm = useConfirm();

  // Controls visibility of the Dean/Head message card.
  const [isDean, setIsDean] = useState(initial?.isDean ?? false);
  const [isHead, setIsHead] = useState(initial?.isHead ?? false);

  useEffect(() => {
    if (state.ok === true) toast.success(isEdit ? 'Faculty saved' : 'Faculty created');
    if (state.ok === false) toast.error(state.error);
  }, [state, isEdit]);

  // Decision D — confirm before swapping Dean/Head role away from
  // the previous holder. The new in-app confirm is async, so we
  // preventDefault unconditionally when a swap is needed, capture the
  // FormData, and re-dispatch via formAction() if the user confirms.
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const takingDean = isDean && currentDean && currentDean.id !== initial?.id;
    const takingHead = isHead && currentHead && currentHead.id !== initial?.id;
    if (!takingDean && !takingHead) return;
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (takingDean) {
      const ok = await confirm({
        title: 'Replace current Dean?',
        message: `Setting this faculty as Dean will remove "${currentDean.name}" from the Dean role. Continue?`,
        confirmLabel: 'Continue',
      });
      if (!ok) return;
    }
    if (takingHead) {
      const ok = await confirm({
        title: 'Replace current Head?',
        message: `Setting this faculty as Head will remove "${currentHead.name}" from the Head role. Continue?`,
        confirmLabel: 'Continue',
      });
      if (!ok) return;
    }
    formAction(fd);
  }

  const showMessageCard = isDean || isHead;

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">
      <Card title="Identity">
        <TextField
          label="Slug" name="slug" required
          defaultValue={initial?.slug ?? ''}
          placeholder="e.g. md-rakib (lowercase, letters/numbers/hyphens)"
          pattern="^[a-z0-9-]+$"
        />
        <TextField
          label="Name" name="name" required
          defaultValue={initial?.name ?? ''}
        />
        <DesignationSelector
          name="designation"
          required
          initialValue={initial?.designation ?? ''}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label="Secondary title" name="secondaryTitle"
            defaultValue={initial?.secondaryTitle ?? ''}
            placeholder="Optional second line"
          />
          <TextField
            label="Badge" name="badge"
            defaultValue={initial?.badge ?? ''}
            placeholder="e.g. Dean (leadership only)"
          />
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Type <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
          </label>
          <select
            id="type" name="type" required
            defaultValue={initial?.type ?? 'full_time'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          >
            <option value="leadership">Leadership</option>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
          </select>
        </div>
      </Card>

      <Card title="Photo">
        <ImageUploader
          kind="faculty-photo"
          name="photo"
          initialUrl={initial?.photoUrl}
          initialPublicId={initial?.photoPublicId}
        />
      </Card>

      <Card title="Contact">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            label="Email" name="email" type="email"
            defaultValue={initial?.email ?? ''}
          />
          <TextField
            label="Phone" name="phone"
            defaultValue={initial?.phone ?? ''}
          />
        </div>
        <TextField
          label="SU ID" name="suId"
          defaultValue={initial?.suId ?? ''}
          placeholder="e.g. SU1603141114"
        />
        <div>
          <label htmlFor="officeAddress" className="block text-sm font-medium text-gray-700 mb-1">
            Office address
          </label>
          <textarea
            id="officeAddress"
            name="officeAddress"
            defaultValue={initial?.officeAddress ?? ''}
            rows={2}
            placeholder="Leave blank to use the university address from /admin/university-identity"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-y"
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Optional. When blank, the public faculty page falls back to the shared
            university address.
          </p>
        </div>
      </Card>

      <Card title="Personal Information">
        <PersonalInfoEditor name="personalInfo" initialValue={initial?.personalInfo as unknown} />
      </Card>

      <Card title="Detail Sections">
        <div className="space-y-4">
          {SECTION_FIELDS.map((f) => (
            <SectionContentEditor
              key={f.name}
              name={f.name}
              label={f.label}
              initialValue={initial?.[f.name as keyof Faculty] as unknown}
              allowItemLinks={f.name === 'publications' || f.name === 'research'}
            />
          ))}
        </div>
      </Card>

      <Card title="Role">
        <p className="text-xs text-gray-500 -mt-1 mb-2">
          Dean and Head should normally be different people. If both flags are set, the same message fields below are used for both /about pages.
        </p>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox" name="isDean"
            checked={isDean}
            onChange={(e) => setIsDean(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent/50"
          />
          This faculty is the Dean
          {currentDean && currentDean.id !== initial?.id && (
            <span className="text-xs font-normal text-gray-500">
              (currently: {currentDean.name})
            </span>
          )}
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox" name="isHead"
            checked={isHead}
            onChange={(e) => setIsHead(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent/50"
          />
          This faculty is the Head of Department
          {currentHead && currentHead.id !== initial?.id && (
            <span className="text-xs font-normal text-gray-500">
              (currently: {currentHead.name})
            </span>
          )}
        </label>
      </Card>

      {showMessageCard && (
        <Card title="Dean / Head Message">
          <TextField
            label="Overline" name="messageOverline"
            defaultValue={initial?.messageOverline ?? ''}
            placeholder='e.g. "A Note from the Dean"'
          />
          <TextField
            label="Heading" name="messageHeading"
            defaultValue={initial?.messageHeading ?? ''}
            placeholder='e.g. "Welcome Message"'
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Paragraphs</label>
            <ParagraphsEditor initialValue={initial?.messageParagraphs ?? []} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Title line 1" name="messageTitleLine1"
              defaultValue={initial?.messageTitleLine1 ?? ''}
              placeholder='e.g. "Dean"'
            />
            <TextField
              label="Title line 2" name="messageTitleLine2"
              defaultValue={initial?.messageTitleLine2 ?? ''}
              placeholder='e.g. "Faculty of Science & Engineering"'
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile photo on the message page
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Optional override. If empty, the main faculty photo is used.
            </p>
            <ImageUploader
              kind="faculty-photo"
              name="messagePhoto"
              initialUrl={initial?.messagePhotoUrl}
              initialPublicId={initial?.messagePhotoPublicId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hero banner at the top of the message page
            </label>
            <ImageUploader
              kind="faculty-message-hero"
              name="messageHeroImage"
              initialUrl={initial?.messageHeroImageUrl}
              initialPublicId={initial?.messageHeroImagePublicId}
            />
            <div className="mt-2">
              <HeroImagePositionSlider
                name="messageHeroImageVerticalPercent"
                initialValue={initial?.messageHeroImageVerticalPercent}
              />
            </div>
          </div>
        </Card>
      )}

      {state.ok === false && (
        <div
          role="alert"
          className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
        >
          {state.error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <Link
          href="/admin/faculty"
          className="px-4 py-2.5 text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors"
        >
          ← Back to list
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="bg-primary hover:bg-primary/90 text-white font-medium rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent/40"
        >
          {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create faculty'}
        </button>
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{title}</h2>
      {children}
    </section>
  );
}

function TextField({
  label, name, defaultValue, required, type = 'text', placeholder, pattern,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  pattern?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <input
        id={name} name={name} type={type}
        defaultValue={defaultValue} required={required}
        placeholder={placeholder} pattern={pattern}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
      />
    </div>
  );
}
