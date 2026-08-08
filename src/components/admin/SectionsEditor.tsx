'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';

// Phase 17 — SectionsEditor.
//
// Edits a list of `{ heading?: string | null, paragraphs: string[] }`
// sections used by /privacy-policy and /terms-and-conditions. The
// chair writes prose only — no HTML markup; the public renderer
// outputs `<h2>` + `<p>` blocks from the structured data.
//
// Serializes the whole sections array as a single hidden JSON input
// so the parent <form> picks it up via FormData.get(name). The
// server action parses + Zod-validates the JSON on submit.

export type LegalSection = {
  heading?: string | null;
  paragraphs: string[];
};

type Props = {
  /** FormData field name for the serialized JSON. */
  name: string;
  initialValue?: readonly LegalSection[];
};

function emptySection(): LegalSection {
  return { heading: '', paragraphs: [''] };
}

export default function SectionsEditor({ name, initialValue }: Props) {
  const [sections, setSections] = useState<LegalSection[]>(
    initialValue && initialValue.length > 0
      ? initialValue.map((s) => ({
          heading: s.heading ?? '',
          paragraphs: [...s.paragraphs],
        }))
      : [emptySection()],
  );

  function addSection() {
    setSections([...sections, emptySection()]);
  }
  function removeSection(idx: number) {
    setSections(sections.filter((_, i) => i !== idx));
  }
  function moveSection(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[idx], next[j]] = [next[j], next[idx]];
    setSections(next);
  }
  function setHeading(idx: number, heading: string) {
    setSections(
      sections.map((s, i) => (i === idx ? { ...s, heading } : s)),
    );
  }
  function addParagraph(idx: number) {
    setSections(
      sections.map((s, i) =>
        i === idx ? { ...s, paragraphs: [...s.paragraphs, ''] } : s,
      ),
    );
  }
  function setParagraph(sIdx: number, pIdx: number, value: string) {
    setSections(
      sections.map((s, i) =>
        i === sIdx
          ? {
              ...s,
              paragraphs: s.paragraphs.map((p, j) => (j === pIdx ? value : p)),
            }
          : s,
      ),
    );
  }
  function removeParagraph(sIdx: number, pIdx: number) {
    setSections(
      sections.map((s, i) =>
        i === sIdx
          ? { ...s, paragraphs: s.paragraphs.filter((_, j) => j !== pIdx) }
          : s,
      ),
    );
  }
  function moveParagraph(sIdx: number, pIdx: number, dir: -1 | 1) {
    const j = pIdx + dir;
    setSections(
      sections.map((s, i) => {
        if (i !== sIdx) return s;
        if (j < 0 || j >= s.paragraphs.length) return s;
        const next = [...s.paragraphs];
        [next[pIdx], next[j]] = [next[j], next[pIdx]];
        return { ...s, paragraphs: next };
      }),
    );
  }

  // Serialize for the form. Empty paragraphs / blank trimmed headings
  // are stripped server-side anyway, but we hand a clean array here
  // so the JSON the server sees is already tidy.
  const serialized = JSON.stringify(
    sections.map((s) => ({
      heading: s.heading?.trim() ? s.heading.trim() : null,
      paragraphs: s.paragraphs.map((p) => p.trim()).filter(Boolean),
    })),
  );

  return (
    <div className="space-y-4">
      {sections.map((section, sIdx) => (
        <div
          key={sIdx}
          className="border border-gray-200 rounded-lg p-4 bg-gray-50/40 space-y-3"
        >
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Section heading (optional)
              </label>
              <input
                type="text"
                value={section.heading ?? ''}
                onChange={(e) => setHeading(sIdx, e.target.value)}
                placeholder="e.g. Consent · Information we collect · Log Files"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent bg-white"
              />
            </div>
            <div className="flex flex-col items-center gap-0.5 shrink-0 pt-6">
              <button
                type="button"
                onClick={() => moveSection(sIdx, -1)}
                disabled={sIdx === 0}
                aria-label="Move section up"
                className="p-1 text-gray-400 hover:text-primary disabled:opacity-30 transition-colors"
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                onClick={() => moveSection(sIdx, 1)}
                disabled={sIdx === sections.length - 1}
                aria-label="Move section down"
                className="p-1 text-gray-400 hover:text-primary disabled:opacity-30 transition-colors"
              >
                <ArrowDown size={16} />
              </button>
              <button
                type="button"
                onClick={() => removeSection(sIdx)}
                aria-label="Remove section"
                disabled={sections.length === 1}
                className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-30 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Paragraphs
            </div>
            {section.paragraphs.length === 0 && (
              <p className="text-xs text-gray-500 italic">
                No paragraphs yet.
              </p>
            )}
            {section.paragraphs.map((p, pIdx) => (
              <div
                key={pIdx}
                className="flex gap-2 border border-gray-200 rounded-lg p-2 bg-white"
              >
                <textarea
                  value={p}
                  onChange={(e) => setParagraph(sIdx, pIdx, e.target.value)}
                  rows={3}
                  placeholder={`Paragraph ${pIdx + 1}…`}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-y"
                />
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveParagraph(sIdx, pIdx, -1)}
                    disabled={pIdx === 0}
                    aria-label="Move paragraph up"
                    className="p-1 text-gray-400 hover:text-primary disabled:opacity-30 transition-colors"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveParagraph(sIdx, pIdx, 1)}
                    disabled={pIdx === section.paragraphs.length - 1}
                    aria-label="Move paragraph down"
                    className="p-1 text-gray-400 hover:text-primary disabled:opacity-30 transition-colors"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeParagraph(sIdx, pIdx)}
                    aria-label="Remove paragraph"
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addParagraph(sIdx)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
            >
              <Plus size={14} /> Add paragraph
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addSection}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-accent transition-colors border border-dashed border-gray-300 hover:border-accent/50 rounded-lg px-4 py-2"
      >
        <Plus size={16} /> Add section
      </button>

      {/* Hidden input — server reads via FormData.get(name) and JSON.parses. */}
      <input type="hidden" name={name} value={serialized} />
    </div>
  );
}
