'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import FormSortableList from './FormSortableList';

// Phase 8c structured editor for {heading, body}[] Json columns.
// Same family as Phase 8b PoliciesEditor but without iconName —
// just title + multi-line body (HTML allowed; rendered via
// dangerouslySetInnerHTML on the public page).
//
// Used by:
//   AdmissionTransferCredits.minimumGradeBullets   — 2 rows, body has inline <strong>
//   AdmissionTransferCredits.documents             — 4 rows, plain text body
//   WaiverCategory.items                            — 3-5 rows per category, plain text body

type Row = { id: string; heading: string; body: string };

function genId() {
  return `hb_${Math.random().toString(36).slice(2, 11)}`;
}

function normalize(initial: unknown): Row[] {
  if (!Array.isArray(initial)) return [];
  return initial
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      id:      genId(),
      heading: typeof r.heading === 'string' ? r.heading : (typeof r.title === 'string' ? r.title : ''),
      // Accept either `body` (transfer-credits bullets) or `text`
      // (waiver-category items) or `description` (transfer-credits
      // documents) on read — write back the configured `bodyField`.
      body:    typeof r.body === 'string' ? r.body
              : typeof r.text === 'string' ? r.text
              : typeof r.description === 'string' ? r.description : '',
    }));
}

type Props = {
  name: string;
  initialValue: unknown;
  // Some Json shapes use {title, description} or {heading, text}.
  // Pass through to match the schema on serialize.
  headingField?: 'heading' | 'title';
  bodyField?: 'body' | 'text' | 'description';
  headingPlaceholder?: string;
  bodyPlaceholder?: string;
  addButtonLabel?: string;
  emptyHint?: string;
};

export default function HeadingBodyListEditor({
  name,
  initialValue,
  headingField = 'heading',
  bodyField = 'body',
  headingPlaceholder = 'Heading',
  bodyPlaceholder = 'Body (HTML allowed)',
  addButtonLabel = 'Add row',
  emptyHint = 'No rows yet.',
}: Props) {
  const [rows, setRows] = useState<Row[]>(() => normalize(initialValue));

  function add() {
    setRows([...rows, { id: genId(), heading: '', body: '' }]);
  }
  function remove(id: string) {
    setRows(rows.filter((r) => r.id !== id));
  }
  function update(id: string, field: 'heading' | 'body', val: string) {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  }
  function reorder(orderedIds: string[]) {
    setRows(orderedIds.map((id) => rows.find((r) => r.id === id)!));
  }

  // Serialize with the schema-specified field names so the Zod
  // schema validates clean.
  const serializable = rows
    .filter((r) => r.heading.trim() || r.body.trim())
    .map((r) => ({ [headingField]: r.heading, [bodyField]: r.body }));

  return (
    <div className="space-y-2">
      {rows.length === 0 && (
        <p className="text-xs text-gray-500 italic">{emptyHint}</p>
      )}
      <FormSortableList
        items={rows}
        getId={(r) => r.id}
        onReorder={reorder}
        renderItem={(r) => (
          <div className="bg-white border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
                  Heading
                </label>
                <input
                  type="text"
                  value={r.heading}
                  onChange={(e) => update(r.id, 'heading', e.target.value)}
                  placeholder={headingPlaceholder}
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                />
              </div>
              <button
                type="button"
                onClick={() => remove(r.id)}
                aria-label="Remove row"
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
                value={r.body}
                onChange={(e) => update(r.id, 'body', e.target.value)}
                rows={3}
                placeholder={bodyPlaceholder}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent resize-y"
              />
            </div>
          </div>
        )}
      />
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
      >
        <Plus size={14} /> {addButtonLabel}
      </button>
      <input type="hidden" name={name} value={JSON.stringify(serializable)} />
    </div>
  );
}
