'use client';

import { useId } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

// Controlled drag-reorder list for in-form editors (Phase 8b
// OverviewStatsEditor / PoliciesEditor / ShiftsEditor).
//
// Differs from src/components/admin/SortableList.tsx (Phase 0+) which
// is purpose-built for list pages that persist reorder to the server
// immediately (toast "Order saved" on every drag). Inside an unsaved
// form, that toast would be misleading because the change is local
// until Save. This component:
//
//   - is fully controlled: caller passes items, no internal state
//   - calls onReorder synchronously with the new ordered ids
//   - emits no toast (errors are the caller's responsibility)
//
// Each instance gets its own DndContext (via useId) so nested usage
// works — a tier list inside a group inside a shift inside the
// outermost shifts list, each level has its own SortableContext and
// drag interactions don't leak across levels.

type Props<T> = {
  items: T[];
  getId: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  onReorder: (orderedIds: string[]) => void;
};

export default function FormSortableList<T>({
  items,
  getId,
  renderItem,
  onReorder,
}: Props<T>) {
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => getId(i) === active.id);
    const newIndex = items.findIndex((i) => getId(i) === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(items, oldIndex, newIndex);
    onReorder(reordered.map(getId));
  }

  return (
    <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(getId)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {items.map((item) => (
            <FormSortableItem key={getId(item)} id={getId(item)}>
              {renderItem(item)}
            </FormSortableItem>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function FormSortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="flex items-start gap-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-2 mt-1 lg:p-1 lg:mt-2 shrink-0 focus:outline-none focus:ring-2 focus:ring-accent/40 rounded touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </button>
      <div className="flex-1 min-w-0">{children}</div>
    </li>
  );
}
