'use client';

import { useMemo, useState } from 'react';

type WithId = { id: string };

// Admin list pattern — Server Component fetches rows via Prisma and
// passes them to a client list. After a successful delete the chair
// wants the row to disappear instantly, but router.refresh() on its
// own is unreliable on Vercel: the next RSC payload sometimes still
// contains the deleted row (cache lag), so the user sees it pop back
// in until manual reload.
//
// Earlier version of this hook mirrored `initial` into useState +
// useEffect-resynced on every prop change. That actively undid the
// optimistic removal: when the stale RSC payload landed, useEffect
// reset state right back to include the deleted row. PR #29 / 33.
//
// Current shape: keep the prop as the source of truth and layer a
// locally-tracked set of "deleted" ids on top. Filtered view is
// derived on every render, so:
//   • optimistic delete is instant (set the id) and sticky
//     (no resync clobbers it),
//   • adds / edits / reorders from new props flow through unchanged,
//   • once the server eventually catches up and drops the id from
//     `initial`, the filter no-ops on the missing id — extra ids in
//     the set are harmless, no cleanup needed.
export function useAdminListItems<T extends WithId>(initial: T[]) {
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set());

  const items = useMemo(
    () => initial.filter((x) => !deletedIds.has(x.id)),
    [initial, deletedIds],
  );

  function removeById(id: string) {
    setDeletedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  return { items, removeById };
}
