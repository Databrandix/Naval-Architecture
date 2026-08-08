'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import FormSortableList from './FormSortableList';
import IconInputField from './IconInputField';

// Structured editor for ProgramFeeStructure.shifts Json — three
// levels of nesting:
//   Shift (iconName, name, shiftLabel, description)
//     └─ groups []
//          └─ Group (background)
//     └─ tiers []
//          └─ Tier (gpa, totalCredits, perCredit, total)
//
// Each level uses its own FormSortableList instance so drag-reorder
// is scoped per level (a tier can't be dragged out of its group).
// Single source of truth at the top: a Shift[] state with id-keyed
// rows for stable React keys + drag identity. Numbers (perCredit /
// total) are kept as strings in state for controlled input; coerced
// to Number on serialize. Falsy after coercion = 0 (matches the
// upstream Zod feeTierSchema which expects z.number()).

type Tier = {
  id: string;
  gpa: string;
  waiver: string;
  totalCredits: string;
  perCredit: string;
  total: string;
};
type Group = {
  id: string;
  background: string;
  tiers: Tier[];
};
type Shift = {
  id: string;
  iconName: string;
  name: string;
  shiftLabel: string;
  description: string;
  groups: Group[];
};

function genId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}`;
}

function normalize(initial: unknown): Shift[] {
  if (!Array.isArray(initial)) return [];
  return initial
    .filter((s): s is Record<string, unknown> => typeof s === 'object' && s !== null)
    .map((s) => ({
      id:          genId('sh'),
      iconName:    typeof s.iconName    === 'string' ? s.iconName    : '',
      name:        typeof s.name        === 'string' ? s.name        : '',
      shiftLabel:  typeof s.shiftLabel  === 'string' ? s.shiftLabel  : '',
      description: typeof s.description === 'string' ? s.description : '',
      groups: Array.isArray(s.groups)
        ? (s.groups as unknown[])
            .filter((g): g is Record<string, unknown> => typeof g === 'object' && g !== null)
            .map((g) => ({
              id:         genId('gr'),
              background: typeof g.background === 'string' ? g.background : '',
              tiers: Array.isArray(g.tiers)
                ? (g.tiers as unknown[])
                    .filter((t): t is Record<string, unknown> => typeof t === 'object' && t !== null)
                    .map((t) => ({
                      id:           genId('ti'),
                      gpa:          typeof t.gpa          === 'string' ? t.gpa          : '',
                      waiver:       typeof t.waiver       === 'string' ? t.waiver       : '',
                      totalCredits: typeof t.totalCredits === 'number' ? String(t.totalCredits) : (typeof t.totalCredits === 'string' ? t.totalCredits : ''),
                      perCredit:    typeof t.perCredit    === 'number' ? String(t.perCredit)    : (typeof t.perCredit    === 'string' ? t.perCredit    : ''),
                      total:        typeof t.total        === 'number' ? String(t.total)        : (typeof t.total     === 'string' ? t.total     : ''),
                    }))
                : [],
            }))
        : [],
    }));
}

type Props = {
  name: string;
  initialValue: unknown;
};

export default function ShiftsEditor({ name, initialValue }: Props) {
  const [shifts, setShifts] = useState<Shift[]>(() => normalize(initialValue));

  // ── Shift mutators ──────────────────────────────────────────
  function addShift() {
    setShifts([...shifts, {
      id: genId('sh'), iconName: '', name: '', shiftLabel: '', description: '', groups: [],
    }]);
  }
  function removeShift(shiftId: string) {
    setShifts(shifts.filter((s) => s.id !== shiftId));
  }
  function updateShift(shiftId: string, field: 'iconName' | 'name' | 'shiftLabel' | 'description', val: string) {
    setShifts(shifts.map((s) => (s.id === shiftId ? { ...s, [field]: val } : s)));
  }
  function reorderShifts(orderedIds: string[]) {
    setShifts(orderedIds.map((id) => shifts.find((s) => s.id === id)!));
  }

  // ── Group mutators (scoped to a parent shift) ───────────────
  function addGroup(shiftId: string) {
    setShifts(shifts.map((s) => s.id === shiftId
      ? { ...s, groups: [...s.groups, { id: genId('gr'), background: '', tiers: [] }] }
      : s));
  }
  function removeGroup(shiftId: string, groupId: string) {
    setShifts(shifts.map((s) => s.id === shiftId
      ? { ...s, groups: s.groups.filter((g) => g.id !== groupId) }
      : s));
  }
  function updateGroup(shiftId: string, groupId: string, field: 'background', val: string) {
    setShifts(shifts.map((s) => s.id === shiftId
      ? { ...s, groups: s.groups.map((g) => (g.id === groupId ? { ...g, [field]: val } : g)) }
      : s));
  }
  function reorderGroups(shiftId: string, orderedIds: string[]) {
    setShifts(shifts.map((s) => {
      if (s.id !== shiftId) return s;
      return { ...s, groups: orderedIds.map((id) => s.groups.find((g) => g.id === id)!) };
    }));
  }

  // ── Tier mutators (scoped to a parent shift+group) ──────────
  function addTier(shiftId: string, groupId: string) {
    setShifts(shifts.map((s) => s.id === shiftId
      ? {
          ...s,
          groups: s.groups.map((g) => g.id === groupId
            ? { ...g, tiers: [...g.tiers, { id: genId('ti'), gpa: '', waiver: '', totalCredits: '', perCredit: '', total: '' }] }
            : g),
        }
      : s));
  }
  function removeTier(shiftId: string, groupId: string, tierId: string) {
    setShifts(shifts.map((s) => s.id === shiftId
      ? {
          ...s,
          groups: s.groups.map((g) => g.id === groupId
            ? { ...g, tiers: g.tiers.filter((t) => t.id !== tierId) }
            : g),
        }
      : s));
  }
  function updateTier(shiftId: string, groupId: string, tierId: string, field: 'gpa' | 'waiver' | 'totalCredits' | 'perCredit' | 'total', val: string) {
    setShifts(shifts.map((s) => s.id === shiftId
      ? {
          ...s,
          groups: s.groups.map((g) => g.id === groupId
            ? { ...g, tiers: g.tiers.map((t) => (t.id === tierId ? { ...t, [field]: val } : t)) }
            : g),
        }
      : s));
  }
  function reorderTiers(shiftId: string, groupId: string, orderedIds: string[]) {
    setShifts(shifts.map((s) => {
      if (s.id !== shiftId) return s;
      return {
        ...s,
        groups: s.groups.map((g) => {
          if (g.id !== groupId) return g;
          return { ...g, tiers: orderedIds.map((id) => g.tiers.find((t) => t.id === id)!) };
        }),
      };
    }));
  }

  // ── Serialize (strip local ids; coerce perCredit/total to Number) ──
  const serializable = shifts.map((s) => ({
    iconName: s.iconName,
    name: s.name,
    shiftLabel: s.shiftLabel,
    description: s.description,
    groups: s.groups.map((g) => ({
      background: g.background,
      tiers: g.tiers.map((t) => ({
        gpa: t.gpa,
        waiver: t.waiver || undefined,
        totalCredits: Number(t.totalCredits) || undefined,
        perCredit: Number(t.perCredit) || 0,
        total:     Number(t.total)     || 0,
      })),
    })),
  }));

  return (
    <div className="space-y-3">
      {shifts.length === 0 && (
        <p className="text-xs text-gray-500 italic">No shifts yet.</p>
      )}
      <FormSortableList
        items={shifts}
        getId={(s) => s.id}
        onReorder={reorderShifts}
        renderItem={(shift) => (
          <ShiftCard
            shift={shift}
            onUpdate={(field, val) => updateShift(shift.id, field, val)}
            onRemove={() => removeShift(shift.id)}
            onAddGroup={() => addGroup(shift.id)}
            onRemoveGroup={(gid) => removeGroup(shift.id, gid)}
            onUpdateGroup={(gid, field, val) => updateGroup(shift.id, gid, field, val)}
            onReorderGroups={(ids) => reorderGroups(shift.id, ids)}
            onAddTier={(gid) => addTier(shift.id, gid)}
            onRemoveTier={(gid, tid) => removeTier(shift.id, gid, tid)}
            onUpdateTier={(gid, tid, field, val) => updateTier(shift.id, gid, tid, field, val)}
            onReorderTiers={(gid, ids) => reorderTiers(shift.id, gid, ids)}
          />
        )}
      />
      <button
        type="button"
        onClick={addShift}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
      >
        <Plus size={14} /> Add shift
      </button>
      <input type="hidden" name={name} value={JSON.stringify(serializable)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Shift card (level 1)
// ─────────────────────────────────────────────────────────────────

function ShiftCard({
  shift,
  onUpdate,
  onRemove,
  onAddGroup,
  onRemoveGroup,
  onUpdateGroup,
  onReorderGroups,
  onAddTier,
  onRemoveTier,
  onUpdateTier,
  onReorderTiers,
}: {
  shift: Shift;
  onUpdate: (field: 'iconName' | 'name' | 'shiftLabel' | 'description', val: string) => void;
  onRemove: () => void;
  onAddGroup: () => void;
  onRemoveGroup: (groupId: string) => void;
  onUpdateGroup: (groupId: string, field: 'background', val: string) => void;
  onReorderGroups: (orderedIds: string[]) => void;
  onAddTier: (groupId: string) => void;
  onRemoveTier: (groupId: string, tierId: string) => void;
  onUpdateTier: (groupId: string, tierId: string, field: 'gpa' | 'waiver' | 'totalCredits' | 'perCredit' | 'total', val: string) => void;
  onReorderTiers: (groupId: string, orderedIds: string[]) => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">Shift</h4>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove shift"
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-0.5">Icon</label>
          <IconInputField
            compact
            value={shift.iconName}
            onChange={(v) => onUpdate('iconName', v)}
            placeholder="Sun"
          />
        </div>
        <Input label="Name" value={shift.name}
               onChange={(v) => onUpdate('name', v)} placeholder="SUN" />
        <Input label="Shift label" value={shift.shiftLabel}
               onChange={(v) => onUpdate('shiftLabel', v)} placeholder="Morning Shift" />
        <Input label="Description" value={shift.description}
               onChange={(v) => onUpdate('description', v)} placeholder="Primarily for SSC + HSC…" />
      </div>

      {/* Groups list (level 2) */}
      <div className="space-y-2 bg-gray-50/60 border border-gray-200 rounded p-3">
        <h5 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">
          Background groups
        </h5>
        {shift.groups.length === 0 && (
          <p className="text-xs text-gray-500 italic">No groups yet.</p>
        )}
        <FormSortableList
          items={shift.groups}
          getId={(g) => g.id}
          onReorder={onReorderGroups}
          renderItem={(group) => (
            <GroupCard
              group={group}
              onUpdate={(field, val) => onUpdateGroup(group.id, field, val)}
              onRemove={() => onRemoveGroup(group.id)}
              onAddTier={() => onAddTier(group.id)}
              onRemoveTier={(tid) => onRemoveTier(group.id, tid)}
              onUpdateTier={(tid, field, val) => onUpdateTier(group.id, tid, field, val)}
              onReorderTiers={(ids) => onReorderTiers(group.id, ids)}
            />
          )}
        />
        <button
          type="button"
          onClick={onAddGroup}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
        >
          <Plus size={14} /> Add group
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Group card (level 2)
// ─────────────────────────────────────────────────────────────────

function GroupCard({
  group,
  onUpdate,
  onRemove,
  onAddTier,
  onRemoveTier,
  onUpdateTier,
  onReorderTiers,
}: {
  group: Group;
  onUpdate: (field: 'background', val: string) => void;
  onRemove: () => void;
  onAddTier: () => void;
  onRemoveTier: (tierId: string) => void;
  onUpdateTier: (tierId: string, field: 'gpa' | 'waiver' | 'totalCredits' | 'perCredit' | 'total', val: string) => void;
  onReorderTiers: (orderedIds: string[]) => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <Input label="Background" value={group.background}
                 onChange={(v) => onUpdate('background', v)} placeholder="SSC + HSC" />
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove group"
          className="self-end p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tiers list (level 3) */}
      <div className="space-y-1.5 bg-accent/5 border border-accent/15 rounded p-2.5">
        <h6 className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
          Fee tiers
        </h6>
        {group.tiers.length === 0 && (
          <p className="text-xs text-gray-500 italic">No tiers yet.</p>
        )}
        <FormSortableList
          items={group.tiers}
          getId={(t) => t.id}
          onReorder={onReorderTiers}
          renderItem={(tier) => (
            <div className="bg-white border border-gray-200 rounded grid grid-cols-1 md:grid-cols-[1fr_80px_80px_100px_100px_auto] gap-1.5 p-2 items-start">
              <Input label="GPA range" value={tier.gpa}
                     onChange={(v) => onUpdateTier(tier.id, 'gpa', v)}
                     placeholder="5.00 – 8.99" />
              <Input label="Waiver" value={tier.waiver}
                     onChange={(v) => onUpdateTier(tier.id, 'waiver', v)}
                     placeholder="55%" />
              <Input label="Credits" value={tier.totalCredits} inputMode="numeric"
                     onChange={(v) => onUpdateTier(tier.id, 'totalCredits', v)}
                     placeholder="161" />
              <Input label="Per credit" value={tier.perCredit} inputMode="numeric"
                     onChange={(v) => onUpdateTier(tier.id, 'perCredit', v)}
                     placeholder="975" />
              <Input label="Total" value={tier.total} inputMode="numeric"
                     onChange={(v) => onUpdateTier(tier.id, 'total', v)}
                     placeholder="264500" />
              <button
                type="button"
                onClick={() => onRemoveTier(tier.id)}
                aria-label="Remove tier"
                className="self-end p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}
        />
        <button
          type="button"
          onClick={onAddTier}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
        >
          <Plus size={12} /> Add tier
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  Shared inline input
// ─────────────────────────────────────────────────────────────────

function Input({
  label, value, onChange, placeholder, inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: 'text' | 'numeric';
}) {
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
        inputMode={inputMode}
        className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
      />
    </div>
  );
}
