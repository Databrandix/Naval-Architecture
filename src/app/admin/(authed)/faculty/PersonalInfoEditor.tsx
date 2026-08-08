'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

type Row = { label: string; value: string };

type Props = {
  name: string;
  initialValue: unknown;
};

function normalize(v: unknown): Row[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r): r is { label?: unknown; value?: unknown } =>
      typeof r === 'object' && r !== null,
    )
    .map((r) => ({
      label: typeof r.label === 'string' ? r.label : '',
      value: typeof r.value === 'string' ? r.value : '',
    }));
}

export default function PersonalInfoEditor({ name, initialValue }: Props) {
  const [rows, setRows] = useState<Row[]>(normalize(initialValue));

  function addRow() {
    setRows([...rows, { label: '', value: '' }]);
  }
  function updateRow(i: number, key: 'label' | 'value', val: string) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  }
  function removeRow(i: number) {
    setRows(rows.filter((_, idx) => idx !== i));
  }

  // Drop visually-empty rows server-side via the cleaned serialization.
  const cleaned = rows.filter((r) => r.label.trim() || r.value.trim());

  return (
    <div className="space-y-2">
      {rows.length === 0 && (
        <p className="text-xs text-gray-500 italic">No personal-info rows yet.</p>
      )}
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={row.label}
            onChange={(e) => updateRow(i, 'label', e.target.value)}
            placeholder="Label (e.g. Name)"
            className="w-40 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          />
          <input
            type="text"
            value={row.value}
            onChange={(e) => updateRow(i, 'value', e.target.value)}
            placeholder="Value"
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          />
          <button
            type="button"
            onClick={() => removeRow(i)}
            aria-label="Remove row"
            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
      >
        <Plus size={14} /> Add row
      </button>
      <input type="hidden" name={name} value={JSON.stringify(cleaned)} />
    </div>
  );
}
