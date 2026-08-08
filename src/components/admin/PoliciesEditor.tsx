'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import FormSortableList from './FormSortableList';
import IconInputField from './IconInputField';

// Structured editor for ProgramFeeStructure.policies Json:
//   [{ iconName, title, text }]  — the 3 policy cards below the
//   shifts on /admission/tuition-fees.

type Row = { id: string; iconName: string; title: string; text: string };

function genId() {
  return `p_${Math.random().toString(36).slice(2, 11)}`;
}

function normalize(initial: unknown): Row[] {
  if (!Array.isArray(initial)) return [];
  return initial
    .filter((r): r is { iconName?: unknown; title?: unknown; text?: unknown } =>
      typeof r === 'object' && r !== null,
    )
    .map((r) => ({
      id: genId(),
      iconName: typeof r.iconName === 'string' ? r.iconName : '',
      title:    typeof r.title    === 'string' ? r.title    : '',
      text:     typeof r.text     === 'string' ? r.text     : '',
    }));
}

type Props = {
  name: string;
  initialValue: unknown;
};

export default function PoliciesEditor({ name, initialValue }: Props) {
  const [rows, setRows] = useState<Row[]>(() => normalize(initialValue));

  function add() {
    setRows([...rows, { id: genId(), iconName: '', title: '', text: '' }]);
  }
  function remove(id: string) {
    setRows(rows.filter((r) => r.id !== id));
  }
  function update(id: string, field: 'iconName' | 'title' | 'text', val: string) {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  }
  function reorder(orderedIds: string[]) {
    setRows(orderedIds.map((id) => rows.find((r) => r.id === id)!));
  }

  const serializable = rows
    .filter((r) => r.iconName.trim() || r.title.trim() || r.text.trim())
    .map(({ id: _id, ...rest }) => rest);

  return (
    <div className="space-y-2">
      {rows.length === 0 && (
        <p className="text-xs text-gray-500 italic">No policies yet.</p>
      )}
      <FormSortableList
        items={rows}
        getId={(r) => r.id}
        onReorder={reorder}
        renderItem={(r) => (
          <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-2 items-start">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
                  Icon
                </label>
                <IconInputField
                  compact
                  value={r.iconName}
                  onChange={(v) => update(r.id, 'iconName', v)}
                  placeholder="Award"
                />
              </div>
              <Input
                label="Title"
                value={r.title}
                onChange={(v) => update(r.id, 'title', v)}
                placeholder="Golden A+ Waiver"
              />
              <button
                type="button"
                onClick={() => remove(r.id)}
                aria-label="Remove policy"
                className="self-end p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
                Body (HTML allowed)
              </label>
              <textarea
                value={r.text}
                onChange={(e) => update(r.id, 'text', e.target.value)}
                rows={3}
                placeholder="Students with a Golden A+ in both SSC and HSC receive a 100% Tuition Fee Waiver."
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent resize-y"
              />
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
          <Plus size={14} /> Add policy
        </button>
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
