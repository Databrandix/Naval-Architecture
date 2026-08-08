'use client';

import { useMemo, useState } from 'react';

// Chair-curated list of standard institutional designations. Stored
// as plain strings in Faculty.designation — the dropdown is a UX
// convenience, not a schema enum, so adding/removing options is a
// single-line edit here with no migration. Custom values from
// pre-existing rows continue to work via the "Custom" branch below.
const PRESET_DESIGNATIONS = [
  'Dean',
  'Associate Dean',
  'Chairman / Chairperson',
  'Head of Department (HOD)',
  'Director',
  'Assistant Director',
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Lecturer',
  'Senior Lecturer',
  'Adjunct Professor',
  'Visiting Professor',
  'Visiting Faculty',
  'Research Assistant (RA)',
  'Instructor',
  'Program Coordinator',
  'Academic Coordinator',
] as const;

const CUSTOM_SENTINEL = '__custom__';

interface Props {
  name: string;
  initialValue: string;
  required?: boolean;
}

export default function DesignationSelector({
  name,
  initialValue,
  required,
}: Props) {
  // Decide the starting mode based on whether the existing value
  // matches a preset. Existing rows with off-list values (e.g.
  // "Head, Department of Electrical and Electronics Engineering") land in custom
  // mode pre-populated so the admin sees what's there.
  const presetMatch = useMemo(
    () => (PRESET_DESIGNATIONS as readonly string[]).includes(initialValue),
    [initialValue],
  );

  const [selected, setSelected] = useState<string>(
    initialValue === ''
      ? ''
      : presetMatch
        ? initialValue
        : CUSTOM_SENTINEL,
  );
  const [customValue, setCustomValue] = useState<string>(
    presetMatch || initialValue === '' ? '' : initialValue,
  );

  const isCustom = selected === CUSTOM_SENTINEL;
  const finalValue = isCustom ? customValue : selected;

  return (
    <div>
      <label
        htmlFor="designation-select"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Designation
        {required && (
          <span className="text-red-500 ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <select
        id="designation-select"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent bg-white"
      >
        <option value="" disabled>
          Select a designation…
        </option>
        {PRESET_DESIGNATIONS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
        <option value={CUSTOM_SENTINEL}>Custom…</option>
      </select>

      {isCustom && (
        <input
          type="text"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          placeholder="Type a custom designation"
          required={required}
          className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          autoFocus
        />
      )}

      {/* The actual form field — server reads `name="designation"`.
          Carries the preset value OR the custom string transparently
          so admin-actions/faculty.ts needs no change. */}
      <input type="hidden" name={name} value={finalValue} />
    </div>
  );
}
