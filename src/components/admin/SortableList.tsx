'use client';

import { useEffect, useId, useState } from 'react';
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
import { toast } from 'sonner';

type Props<T> = {
  items: T[];
  getId: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  /** Server action — receives the new id order; throw to surface an error toast. */
  onReorder: (orderedIds: string[]) => Promise<void>;
};

export default function SortableList<T>({
  items: initial,
  getId,
  renderItem,
  onReorder,
}: Props<T>) {
  const [items, setItems] = useState(initial);

  // Sync local state when the prop changes. Without this, deletes
  // handled by the parent (via useAdminListItems removeById) never
  // reach the rendered list because useState(initial) only seeds
  // once on mount. The parent's hook already protects against stale
  // RSC payloads, so resyncing here is safe — we won't get
  // resurrected rows.
  useEffect(() => {
    setItems(initial);
  }, [initial]);
  // Stable per-instance id — without this, dnd-kit's internal counter
  // produces non-deterministic accessibility ids (DndDescribedBy-N)
  // across SSR ↔ hydration when multiple SortableLists live on the
  // same page (e.g. /admin/nav, /admin/footer-links).
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => getId(i) === active.id);
    const newIndex = items.findIndex((i) => getId(i) === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const prev = items;
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    try {
      await onReorder(reordered.map(getId));
      toast.success('Order saved');
    } catch (err) {
      setItems(prev);
      toast.error(err instanceof Error ? err.message : 'Reorder failed');
    }
  }

  return (
    <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(getId)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {items.map((item) => (
            <SortableItem key={getId(item)} id={getId(item)}>
              {renderItem(item)}
            </SortableItem>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
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
      className="flex items-center bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-2 -ml-1 mr-2 lg:p-1 lg:mr-3 focus:outline-none focus:ring-2 focus:ring-accent/40 rounded touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical size={18} />
      </button>
      <div className="flex-1 min-w-0">{children}</div>
    </li>
  );
}
