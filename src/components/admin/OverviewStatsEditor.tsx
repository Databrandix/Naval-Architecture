'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import FormSortableList from './FormSortableList';
import IconInputField from './IconInputField';

// Structured editor for ProgramFeeStructure.overviewStats Json:
//   [{ iconName, label, value }]  — exactly the 4 cards above the
//   shifts on /admission/tuition-fees.
//
// Outputs a single hidden input (JSON-encoded array, ids stripped)
// so the server action reads it via formData.get(name) + JSON.parse,
// matching the same shape Zod validates downstream.

type Row = { id: string; iconName: string; label: string; value: string };

function genId() {
  return `s_${Math.random().toString(36).slice(2, 11)}`;
}

function normalize(initial: unknown): Row[] {
  if (!Array.isArray(initial)) return [];
  return initial
    .filter((r): r is { iconName?: unknown; label?: unknown; value?: unknown } =>
      typeof r === 'object' && r !== null,
    )
    .map((r) => ({
      id: genId(),
      iconName: typeof r.iconName === 'string' ? r.iconName : '',
      label:    typeof r.label    === 'string' ? r.label    : '',
      value:    typeof r.value    === 'string' ? r.value    : '',
    }));
}

type Props = {
  name: string;
  initialValue: unknown;
};

export default function OverviewStatsEditor({ name, initialValue }: Props) {
  const [rows, setRows] = useState<Row[]>(() => normalize(initialValue));

  function add() {
    setRows([...rows, { id: genId(), iconName: '', label: '', value: '' }]);
  }
  function remove(id: string) {
    setRows(rows.filter((r) => r.id !== id));
  }
  function update(id: string, field: 'iconName' | 'label' | 'value', val: string) {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  }
  function reorder(orderedIds: string[]) {
    setRows(orderedIds.map((id) => rows.find((r) => r.id === id)!));
  }

  const serializable = rows
    .filter((r) => r.iconName.trim() || r.label.trim() || r.value.trim())
    .map(({ id: _id, ...rest }) => rest);

  return (
    <div className="space-y-2">
      {rows.length === 0 && (
        <p className="text-xs text-gray-500 italic">No stats yet.</p>
      )}
      <FormSortableList
        items={rows}
        getId={(r) => r.id}
        onReorder={reorder}
        renderItem={(r) => (
          <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_180px_auto] gap-2 items-start">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
                  Icon
                </label>
                <IconInputField
                  compact
                  value={r.iconName}
                  onChange={(v) => update(r.id, 'iconName', v)}
                  placeholder="GraduationCap"
                />
              </div>
              <Input
                label="Label"
                value={r.label}
                onChange={(v) => update(r.id, 'label', v)}
                placeholder="Total Credits"
              />
              <Input
                label="Value"
                value={r.value}
                onChange={(v) => update(r.id, 'value', v)}
                placeholder="160"
              />
              <button
                type="button"
                onClick={() => remove(r.id)}
                aria-label="Remove stat"
                className="self-end p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
        >
          <Plus size={14} /> Add stat
        </button>
        <p className="text-xs text-gray-500">
          Icon is a <code className="font-mono">lucide-react</code> name. Public render falls back to a generic info icon if not recognized.
        </p>
      </div>
      <input type="hidden" name={name} value={JSON.stringify(serializable)} />
    </div>
  );
}

function Input({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
      />
    </div>
  );
}
