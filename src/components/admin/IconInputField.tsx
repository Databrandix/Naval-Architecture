'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AlertCircle, Sparkles } from 'lucide-react';
import { DynamicLucideIcon, hasIcon } from '@/components/ui/DynamicLucideIcon';

// Phase 20 — admin icon input field.
//   • Free-text input retained (typing as primary affordance)
//   • Live preview on the left edge of the input — the icon the
//     editor is choosing renders inline as they type
//   • Picker trigger button on the right opens LucideIconPicker
//     (lazy-loaded — its full-namespace Lucide import enters the
//     bundle only when the picker actually mounts)
//   • Invalid-name warning when the typed value doesn't resolve
//     (silent fallback at the public renderer; this surface keeps
//     the editor aware mid-edit)
//
// Used across 11 admin integration points per CP20.1 inventory.

const LucideIconPicker = dynamic(() => import('./LucideIconPicker'), {
  ssr: false,
});

interface Props {
  name?: string;          // hidden / native input name (omit inside Json editors)
  value: string;
  onChange: (next: string) => void;
  label?: string;
  required?: boolean;
  helperText?: string;
  placeholder?: string;
  // Optional: smaller form-row variant used inside structured
  // editor cards (ActivitiesEditor, etc.) — drops the label
  // chrome since the parent card already has its own headings.
  compact?: boolean;
}

export default function IconInputField({
  name,
  value,
  onChange,
  label,
  required,
  helperText,
  placeholder = 'e.g. Flame',
  compact = false,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const trimmed = value.trim();
  const showWarn = trimmed.length > 0 && !hasIcon(trimmed);

  return (
    <div>
      {label && !compact && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="flex items-stretch gap-2">
        <div
          className={
            'flex items-center gap-2 flex-1 border rounded-md px-2.5 py-1.5 bg-white ' +
            (showWarn
              ? 'border-amber-300 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200'
              : 'border-gray-300 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30')
          }
        >
          <span className="w-5 h-5 flex items-center justify-center shrink-0">
            {trimmed && (
              <DynamicLucideIcon
                name={trimmed}
                size={18}
                className={showWarn ? 'text-amber-500' : 'text-gray-700'}
              />
            )}
          </span>
          <input
            type="text"
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            autoComplete="off"
            spellCheck={false}
            className="flex-1 text-sm outline-none bg-transparent placeholder:text-gray-400"
          />
        </div>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="px-3 inline-flex items-center gap-1.5 bg-accent/10 text-accent rounded-md text-xs font-medium hover:bg-accent/20 transition-colors"
          aria-label="Open icon picker"
        >
          <Sparkles size={14} /> Pick
        </button>
      </div>

      {showWarn && (
        <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
          <AlertCircle size={11} />
          Icon not found — fallback will render publicly.
        </p>
      )}
      {helperText && !showWarn && (
        <p className="text-[11px] text-gray-500 mt-1">{helperText}</p>
      )}

      {pickerOpen && (
        <LucideIconPicker
          value={trimmed}
          onSelect={(picked) => onChange(picked)}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
