'use client';

import { useState } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import FormSortableList from './FormSortableList';
import IconInputField from './IconInputField';
import { DynamicLucideIcon, hasIcon } from '@/components/ui/DynamicLucideIcon';

// Phase 10 structured editor for ContactPageContent.quickContactCards
// Json column — { iconName, title, primaryValue, primaryHref?,
// secondaryValue?, secondaryHref?, hint? }[].
//
// Phase 20 — picker / fallback / preview now delegate to the shared
// IconInputField + DynamicLucideIcon. The page-side ICON_MAP that
// this editor used to mirror is gone; admin can pick from any of
// the 2,797 Lucide icons.

type Card = {
  id: string;
  iconName: string;
  title: string;
  primaryValue: string;
  primaryHref: string;
  secondaryValue: string;
  secondaryHref: string;
  hint: string;
};

function genId() {
  return `qc_${Math.random().toString(36).slice(2, 11)}`;
}

function emptyCard(): Card {
  return {
    id: genId(),
    iconName: '',
    title: '',
    primaryValue: '',
    primaryHref: '',
    secondaryValue: '',
    secondaryHref: '',
    hint: '',
  };
}

function normalize(initial: unknown): Card[] {
  if (!Array.isArray(initial)) return [];
  return initial
    .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
    .map((c) => ({
      id:             genId(),
      iconName:       typeof c.iconName       === 'string' ? c.iconName       : '',
      title:          typeof c.title          === 'string' ? c.title          : '',
      primaryValue:   typeof c.primaryValue   === 'string' ? c.primaryValue   : '',
      primaryHref:    typeof c.primaryHref    === 'string' ? c.primaryHref    : '',
      secondaryValue: typeof c.secondaryValue === 'string' ? c.secondaryValue : '',
      secondaryHref:  typeof c.secondaryHref  === 'string' ? c.secondaryHref  : '',
      hint:           typeof c.hint           === 'string' ? c.hint           : '',
    }));
}

type Props = {
  name: string;
  initialValue: unknown;
};

export default function QuickContactCardsEditor({ name, initialValue }: Props) {
  const [cards, setCards] = useState<Card[]>(() => normalize(initialValue));

  function add() {
    setCards([...cards, emptyCard()]);
  }
  function remove(id: string) {
    setCards(cards.filter((c) => c.id !== id));
  }
  function update<K extends keyof Omit<Card, 'id'>>(id: string, field: K, val: string) {
    setCards(cards.map((c) => (c.id === id ? { ...c, [field]: val } : c)));
  }
  function reorder(orderedIds: string[]) {
    setCards(orderedIds.map((id) => cards.find((c) => c.id === id)!));
  }

  // Serialize: drop blank cards (no iconName/title/primaryValue) so
  // an admin can leave one empty without it polluting public render.
  // Optional fields are omitted (not "") so JSON stays clean.
  const serializable = cards
    .filter((c) => c.iconName.trim() && c.title.trim() && c.primaryValue.trim())
    .map((c) => {
      const out: Record<string, string> = {
        iconName:     c.iconName.trim(),
        title:        c.title.trim(),
        primaryValue: c.primaryValue.trim(),
      };
      if (c.primaryHref.trim())    out.primaryHref    = c.primaryHref.trim();
      if (c.secondaryValue.trim()) out.secondaryValue = c.secondaryValue.trim();
      if (c.secondaryHref.trim())  out.secondaryHref  = c.secondaryHref.trim();
      if (c.hint.trim())           out.hint           = c.hint.trim();
      return out;
    });

  return (
    <div className="space-y-3">
      {cards.length === 0 && (
        <p className="text-xs text-gray-500 italic">No cards yet. Add one to get started.</p>
      )}
      <FormSortableList
        items={cards}
        getId={(c) => c.id}
        onReorder={reorder}
        renderItem={(c) => (
          <CardEditor card={c} onUpdate={update} onRemove={remove} />
        )}
      />
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
      >
        <Plus size={14} /> Add card
      </button>
      <input type="hidden" name={name} value={JSON.stringify(serializable)} />
    </div>
  );
}

function CardEditor({
  card,
  onUpdate,
  onRemove,
}: {
  card: Card;
  onUpdate: <K extends keyof Omit<Card, 'id'>>(id: string, field: K, val: string) => void;
  onRemove: (id: string) => void;
}) {
  const hasSecondary = card.secondaryValue.trim() !== '' || card.secondaryHref.trim() !== '';
  const hasHint      = card.hint.trim() !== '';
  const [secondaryOpen, setSecondaryOpen] = useState<boolean>(hasSecondary);
  const [hintOpen, setHintOpen]           = useState<boolean>(hasHint);

  const trimmedIconName = card.iconName.trim();
  const iconKnown = trimmedIconName.length > 0 && hasIcon(trimmedIconName);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      {/* Identity row: iconName + title */}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr] gap-3 items-start">
        {/* Icon preview cell */}
        <div className="flex flex-col items-center gap-1 md:pt-5">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <DynamicLucideIcon
              name={trimmedIconName}
              size={18}
              className={iconKnown ? 'text-primary' : 'text-gray-400'}
            />
          </div>
        </div>
        <div>
          <Label>Icon name</Label>
          <IconInputField
            compact
            value={card.iconName}
            onChange={(v) => onUpdate(card.id, 'iconName', v)}
            placeholder="Phone"
          />
        </div>
        <div>
          <Label>Title</Label>
          <input
            type="text"
            value={card.title}
            onChange={(e) => onUpdate(card.id, 'title', e.target.value)}
            placeholder="Phone"
            className={inputClass}
          />
        </div>
      </div>

      {/* Primary contact row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
        <div>
          <Label>Primary value</Label>
          <input
            type="text"
            value={card.primaryValue}
            onChange={(e) => onUpdate(card.id, 'primaryValue', e.target.value)}
            placeholder="+880 2 41010352"
            className={inputClass}
          />
        </div>
        <div>
          <Label>Primary href (optional)</Label>
          <input
            type="text"
            value={card.primaryHref}
            onChange={(e) => onUpdate(card.id, 'primaryHref', e.target.value)}
            placeholder="tel:+880241010352"
            className={inputClass}
          />
          <p className="mt-1 text-[11px] text-gray-500">
            Use <code className="font-mono">tel:</code>, <code className="font-mono">mailto:</code>, or <code className="font-mono">https://</code> format
          </p>
        </div>
      </div>

      {/* Collapsible: Secondary contact */}
      <Collapsible
        label="Secondary contact (optional)"
        open={secondaryOpen}
        onToggle={() => setSecondaryOpen((v) => !v)}
        hasData={hasSecondary}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start pt-2">
          <div>
            <Label>Secondary value</Label>
            <input
              type="text"
              value={card.secondaryValue}
              onChange={(e) => onUpdate(card.id, 'secondaryValue', e.target.value)}
              placeholder="registrar@su.edu.bd"
              className={inputClass}
            />
          </div>
          <div>
            <Label>Secondary href</Label>
            <input
              type="text"
              value={card.secondaryHref}
              onChange={(e) => onUpdate(card.id, 'secondaryHref', e.target.value)}
              placeholder="mailto:registrar@su.edu.bd"
              className={inputClass}
            />
          </div>
        </div>
      </Collapsible>

      {/* Collapsible: Hint */}
      <Collapsible
        label="Hint (optional)"
        open={hintOpen}
        onToggle={() => setHintOpen((v) => !v)}
        hasData={hasHint}
      >
        <div className="pt-2">
          <Label>Hint text</Label>
          <input
            type="text"
            value={card.hint}
            onChange={(e) => onUpdate(card.id, 'hint', e.target.value)}
            placeholder="Sat–Fri, 8 AM – 8 PM"
            className={inputClass}
          />
          <p className="mt-1 text-[11px] text-gray-500">
            Rendered as a small note below the contact value (uses Clock icon).
          </p>
        </div>
      </Collapsible>

      {/* Remove */}
      <div className="flex justify-end pt-1">
        <button
          type="button"
          onClick={() => onRemove(card.id)}
          aria-label="Remove card"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
        >
          <X size={14} /> Remove card
        </button>
      </div>
    </div>
  );
}

function Collapsible({
  label, open, onToggle, hasData, children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  hasData: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-gray-100 pt-2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-700 transition-colors"
      >
        <span className="flex items-center gap-2">
          {label}
          {hasData && !open && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent" aria-label="has data" />
          )}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">
      {children}
    </label>
  );
}

const inputClass =
  'w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent';
