'use client';

import { useState } from 'react';
import { Plus, X, ArrowUp, ArrowDown } from 'lucide-react';

type Props = {
  initialValue?: readonly string[];
  /** FormData field name for each hidden input. Server reads via
   *  formData.getAll(name). Defaults to 'messageParagraphs' for the
   *  Phase 2 Faculty form. */
  name?: string;
  /** Override the helper text below the editor. */
  helpText?: React.ReactNode;
};

// NOTE on reorder UX: spec said "drag handle"; we use up/down arrows
// instead because each paragraph is a tall textarea, and drag-reorder
// over tall variable-height elements is awkward (the drop target
// keeps shifting as the row grows). Arrows give the same outcome
// without the visual lurching.
export default function ParagraphsEditor({
  initialValue,
  name = 'messageParagraphs',
  helpText,
}: Props) {
  const [paragraphs, setParagraphs] = useState<string[]>([...(initialValue ?? [])]);

  function add() {
    setParagraphs([...paragraphs, '']);
  }
  function update(i: number, value: string) {
    setParagraphs(paragraphs.map((p, idx) => (idx === i ? value : p)));
  }
  function remove(i: number) {
    setParagraphs(paragraphs.filter((_, idx) => idx !== i));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= paragraphs.length) return;
    const next = [...paragraphs];
    [next[i], next[j]] = [next[j], next[i]];
    setParagraphs(next);
  }

  return (
    <div className="space-y-2">
      {paragraphs.length === 0 && (
        <p className="text-xs text-gray-500 italic">No paragraphs yet.</p>
      )}
      {paragraphs.map((p, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-2 flex gap-2 bg-gray-50/30">
          <textarea
            value={p}
            onChange={(e) => update(i, e.target.value)}
            rows={4}
            placeholder={'Paragraph text. HTML allowed: <strong class="text-button-yellow">…</strong>'}
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-y bg-white"
          />
          <div className="flex flex-col items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              aria-label="Move up"
              className="p-1 text-gray-400 hover:text-primary disabled:opacity-30 transition-colors"
            >
              <ArrowUp size={16} />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === paragraphs.length - 1}
              aria-label="Move down"
              className="p-1 text-gray-400 hover:text-primary disabled:opacity-30 transition-colors"
            >
              <ArrowDown size={16} />
            </button>
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Remove paragraph"
              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
      >
        <Plus size={14} /> Add paragraph
      </button>
      {helpText ?? (
        <p className="text-xs text-gray-500">
          HTML allowed (rendered as-is). Inline emphasis pattern:{' '}
          <code className="font-mono">&lt;strong class=&quot;text-button-yellow&quot;&gt;…&lt;/strong&gt;</code>
          . The drop-cap on the first paragraph&apos;s first letter is applied automatically by the renderer.
        </p>
      )}
      {/* Hidden inputs — server reads via FormData.getAll(name) */}
      {paragraphs.map((p, i) => (
        <input key={`hidden-${i}`} type="hidden" name={name} value={p} />
      ))}
    </div>
  );
}
