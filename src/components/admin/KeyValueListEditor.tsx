'use client';

import { useState } from 'react';
import { Plus, X, ArrowUp, ArrowDown } from 'lucide-react';

// {label, value}[] editor used by Phase 6 News.meta and Event.details.
// Both columns rendered equally because both fields are full-text in
// the public render ("Participants: 35 Students & 4 Faculty Members"
// / "Chairperson: Professor Md. Mostofa Hossain, Head, …").

type Row = { label: string; value: string };

type Props = {
  name: string;
  initialValue: unknown;
  labelPlaceholder?: string;
  valuePlaceholder?: string;
  addButtonLabel?: string;
  emptyHint?: string;
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

export default function KeyValueListEditor({
  name,
  initialValue,
  labelPlaceholder = 'Label (e.g. Participants)',
  valuePlaceholder = 'Value (e.g. 35 Students & 4 Faculty Members)',
  addButtonLabel = 'Add row',
  emptyHint = 'No rows yet.',
}: Props) {
  const [rows, setRows] = useState<Row[]>(normalize(initialValue));

  function addRow() { setRows([...rows, { label: '', value: '' }]); }
  function updateRow(i: number, key: 'label' | 'value', val: string) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  }
  function removeRow(i: number) { setRows(rows.filter((_, idx) => idx !== i)); }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
  }

  const cleaned = rows.filter((r) => r.label.trim() && r.value.trim());

  return (
    <div className="space-y-2">
      {rows.length === 0 && (
        <p className="text-xs text-gray-500 italic">{emptyHint}</p>
      )}
      {rows.map((row, i) => (
        <div key={i} className="flex items-start gap-2">
          <input
            type="text"
            value={row.label}
            onChange={(e) => updateRow(i, 'label', e.target.value)}
            placeholder={labelPlaceholder}
            className="w-48 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          />
          <input
            type="text"
            value={row.value}
            onChange={(e) => updateRow(i, 'value', e.target.value)}
            placeholder={valuePlaceholder}
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
          />
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button" onClick={() => move(i, -1)} disabled={i === 0}
              aria-label="Move up"
              className="p-1 text-gray-400 hover:text-primary disabled:opacity-30 transition-colors"
            >
              <ArrowUp size={14} />
            </button>
            <button
              type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1}
              aria-label="Move down"
              className="p-1 text-gray-400 hover:text-primary disabled:opacity-30 transition-colors"
            >
              <ArrowDown size={14} />
            </button>
            <button
              type="button" onClick={() => removeRow(i)}
              aria-label="Remove row"
              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button" onClick={addRow}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
      >
        <Plus size={14} /> {addButtonLabel}
      </button>
      <input type="hidden" name={name} value={JSON.stringify(cleaned)} />
    </div>
  );
}
