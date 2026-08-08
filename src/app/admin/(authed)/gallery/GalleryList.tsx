'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { GalleryImage } from '@prisma/client';
import SortableList from '@/components/admin/SortableList';
import {
  deleteGalleryImageAction,
  reorderGalleryImagesAction,
} from '@/lib/admin-actions/gallery';
import { useAdminListItems } from '@/lib/hooks/useAdminListItems';
import { useConfirm } from '@/components/admin/ConfirmDialogProvider';

export default function GalleryList({ items: initialItems }: { items: GalleryImage[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { items, removeById } = useAdminListItems(initialItems);

  async function handleDelete(id: string, alt: string) {
    const ok = await confirm({
      title: 'Delete gallery image?',
      message: `"${alt}" will be removed permanently. This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const res = await deleteGalleryImageAction(id);
    if (res.ok) {
      removeById(id);
      toast.success('Gallery image deleted');
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 text-sm">No gallery images yet.</p>
        <Link
          href="/admin/gallery/new"
          className="text-accent hover:underline font-medium text-sm mt-2 inline-block"
        >
          Add the first image
        </Link>
      </div>
    );
  }

  return (
    <SortableList
      items={items}
      getId={(g) => g.id}
      onReorder={async (ids) => {
        const res = await reorderGalleryImagesAction(ids);
        if (!res.ok) throw new Error(res.error);
      }}
      renderItem={(img) => (
        <div className="flex items-center justify-between gap-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.imageUrl}
              alt=""
              className="w-14 h-14 rounded bg-gray-50 border border-gray-200 object-cover shrink-0"
            />
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate text-sm">{img.alt}</div>
              <div className="text-xs text-gray-500 truncate font-mono">
                {img.width} × {img.height} · order {img.displayOrder}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href={`/admin/gallery/${img.id}`}
              aria-label="Edit gallery image"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <Pencil size={16} />
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(img.id, img.alt)}
              aria-label="Delete gallery image"
              className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    />
  );
}
