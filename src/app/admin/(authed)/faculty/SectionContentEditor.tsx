'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

type Item = { text: string; url: string };
type Group = { heading: string; items: Item[] };
type SectionItem = string | { text: string; url?: string };
type SectionContent =
  | string
  | SectionItem[]
  | { heading: string; items: SectionItem[] }[];

type Props = {
  name: string;
  label: string;
  initialValue: unknown;
  // When true, each item gets an optional URL field (publications, research).
  allowItemLinks?: boolean;
};

function toItem(v: unknown): Item {
  if (typeof v === 'string') return { text: v, url: '' };
  if (v && typeof v === 'object') {
    const o = v as { text?: unknown; url?: unknown };
    return {
      text: typeof o.text === 'string' ? o.text : '',
      url: typeof o.url === 'string' ? o.url : '',
    };
  }
  return { text: '', url: '' };
}

// Normalize any SectionContent shape into Group[] for editing.
function normalize(v: unknown): Group[] {
  if (v == null) return [];
  if (typeof v === 'string') return [{ heading: '', items: [{ text: v, url: '' }] }];
  if (Array.isArray(v)) {
    if (v.length === 0) return [];
    const first = v[0];
    const grouped =
      typeof first === 'object' && first !== null && 'items' in (first as object);
    if (!grouped) {
      return [{ heading: '', items: (v as unknown[]).map(toItem) }];
    }
    return (v as Array<{ heading?: unknown; items?: unknown }>).map((g) => ({
      heading: typeof g.heading === 'string' ? g.heading : '',
      items: Array.isArray(g.items) ? g.items.map(toItem) : [],
    }));
  }
  return [];
}

// Serialize Group[] back to the simplest matching SectionContent shape.
// A URL on any item forces the object form for that item; otherwise the
// item collapses back to a plain string.
function serialize(groups: Group[]): SectionContent | null {
  const cleaned = groups
    .map((g) => ({
      heading: g.heading.trim(),
      items: g.items
        .map((it) => ({ text: it.text.trim(), url: it.url.trim() }))
        .filter((it) => it.text.length > 0 || it.url.length > 0),
    }))
    .filter((g) => g.heading.length > 0 || g.items.length > 0);

  if (cleaned.length === 0) return null;

  const toSectionItem = (it: { text: string; url: string }): SectionItem =>
    it.url.length > 0 ? { text: it.text, url: it.url } : it.text;

  // Single group with no heading collapses back to string or item array.
  if (cleaned.length === 1 && cleaned[0].heading === '') {
    const items = cleaned[0].items;
    if (items.length === 1 && items[0].url.length === 0) return items[0].text;
    return items.map(toSectionItem);
  }

  return cleaned.map((g) => ({
    heading: g.heading,
    items: g.items.map(toSectionItem),
  }));
}

export default function SectionContentEditor({
  name,
  label,
  initialValue,
  allowItemLinks = false,
}: Props) {
  const [groups, setGroups] = useState<Group[]>(normalize(initialValue));

  function addGroup() {
    setGroups([...groups, { heading: '', items: [{ text: '', url: '' }] }]);
  }
  function removeGroup(gi: number) {
    setGroups(groups.filter((_, idx) => idx !== gi));
  }
  function updateHeading(gi: number, value: string) {
    setGroups(groups.map((g, idx) => (idx === gi ? { ...g, heading: value } : g)));
  }
  function addItem(gi: number) {
    setGroups(
      groups.map((g, idx) =>
        idx === gi ? { ...g, items: [...g.items, { text: '', url: '' }] } : g,
      ),
    );
  }
  function updateItemText(gi: number, ii: number, value: string) {
    setGroups(
      groups.map((g, idx) =>
        idx === gi
          ? { ...g, items: g.items.map((it, i) => (i === ii ? { ...it, text: value } : it)) }
          : g,
      ),
    );
  }
  function updateItemUrl(gi: number, ii: number, value: string) {
    setGroups(
      groups.map((g, idx) =>
        idx === gi
          ? { ...g, items: g.items.map((it, i) => (i === ii ? { ...it, url: value } : it)) }
          : g,
      ),
    );
  }
  function removeItem(gi: number, ii: number) {
    setGroups(
      groups.map((g, idx) =>
        idx === gi ? { ...g, items: g.items.filter((_, i) => i !== ii) } : g,
      ),
    );
  }

  const serialized = serialize(groups);

  return (
    <div className="space-y-3 border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {groups.length === 0 && (
          <button
            type="button"
            onClick={addGroup}
            className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
          >
            <Plus size={12} /> Add section
          </button>
        )}
      </div>

      {groups.length === 0 && (
        <p className="text-xs text-gray-400 italic">No content.</p>
      )}

      {groups.map((group, gi) => (
        <div key={gi} className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50/30">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={group.heading}
              onChange={(e) => updateHeading(gi, e.target.value)}
              placeholder="Heading (optional — leave blank for plain list)"
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent font-semibold bg-white"
            />
            <button
              type="button"
              onClick={() => removeGroup(gi)}
              aria-label="Remove section"
              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-1.5 pl-3 border-l-2 border-gray-200">
            {group.items.map((item, ii) => (
              <div key={ii} className="flex items-start gap-2">
                <div className="flex-1 space-y-1.5">
                  <textarea
                    value={item.text}
                    onChange={(e) => updateItemText(gi, ii, e.target.value)}
                    rows={2}
                    placeholder="Item text"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-y bg-white"
                  />
                  {allowItemLinks && (
                    <input
                      type="url"
                      value={item.url}
                      onChange={(e) => updateItemUrl(gi, ii, e.target.value)}
                      placeholder="Link (optional) — e.g. https://doi.org/…"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent bg-white"
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(gi, ii)}
                  aria-label="Remove item"
                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors mt-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addItem(gi)}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
            >
              <Plus size={12} /> Add item
            </button>
          </div>
        </div>
      ))}

      {groups.length > 0 && (
        <button
          type="button"
          onClick={addGroup}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
        >
          <Plus size={14} /> Add another section
        </button>
      )}

      <input
        type="hidden"
        name={name}
        value={serialized === null ? '' : JSON.stringify(serialized)}
      />
    </div>
  );
}
