'use client';

import { useState } from 'react';
import { Plus, X, ArrowUp, ArrowDown } from 'lucide-react';
import IconInputField from './IconInputField';

type Row = { iconName: string; title: string; description: string };

type Props = {
  name: string;
  initialValue: unknown;
};

function normalize(v: unknown): Row[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      iconName:    typeof r.iconName === 'string' ? r.iconName : '',
      title:       typeof r.title === 'string' ? r.title : '',
      description: typeof r.description === 'string' ? r.description : '',
    }));
}

export default function FeaturesEditor({ name, initialValue }: Props) {
  const [rows, setRows] = useState<Row[]>(normalize(initialValue));

  function addRow() {
    setRows([...rows, { iconName: '', title: '', description: '' }]);
  }
  function updateRow(i: number, patch: Partial<Row>) {
    setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function removeRow(i: number) { setRows(rows.filter((_, idx) => idx !== i)); }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
  }

  // Drop visually-empty rows (title is load-bearing)
  const cleaned = rows.filter((r) => r.title.trim());

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="text-xs text-gray-500 italic">No features yet.</p>
      )}

      {rows.map((row, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Feature #{i + 1}
            </span>
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                      aria-label="Move up"
                      className="p-1 text-gray-400 hover:text-primary disabled:opacity-30 transition-colors">
                <ArrowUp size={14} />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1}
                      aria-label="Move down"
                      className="p-1 text-gray-400 hover:text-primary disabled:opacity-30 transition-colors">
                <ArrowDown size={14} />
              </button>
              <button type="button" onClick={() => removeRow(i)}
                      aria-label="Remove feature"
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Lucide icon name</label>
              <IconInputField
                compact
                value={row.iconName}
                onChange={(v) => updateRow(i, { iconName: v })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
              <input
                type="text"
                value={row.title}
                onChange={(e) => updateRow(i, { title: e.target.value })}
                placeholder="Industry-Standard Equipment"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              value={row.description}
              onChange={(e) => updateRow(i, { description: e.target.value })}
              rows={2}
              placeholder="Short description for the feature card…"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-y bg-white"
            />
          </div>
        </div>
      ))}

      <button type="button" onClick={addRow}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors">
        <Plus size={14} /> Add feature
      </button>

      <input type="hidden" name={name} value={JSON.stringify(cleaned)} />
    </div>
  );
}
