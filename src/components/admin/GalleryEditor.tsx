'use client';

import { useState } from 'react';
import { X, ArrowUp, ArrowDown, Plus } from 'lucide-react';
import ImageUploader from './ImageUploader';

// Paired array editor for Lab.gallery + Lab.galleryPublicIds.
// Each gallery item is a {url, publicId} pair; the editor manages
// them as a single ordered list and serializes back to two hidden
// inputs (JSON-encoded String[] each) that the server action
// reads via parseStringArray.

type Item = { url: string; publicId: string };

type Props = {
  /** Hidden input name for the URL array (e.g. "gallery"). */
  urlsName: string;
  /** Hidden input name for the publicId array (e.g. "galleryPublicIds"). */
  publicIdsName: string;
  initialUrls?: readonly string[];
  initialPublicIds?: readonly string[];
};

export default function GalleryEditor({
  urlsName,
  publicIdsName,
  initialUrls,
  initialPublicIds,
}: Props) {
  const initial: Item[] = (initialUrls ?? []).map((url, i) => ({
    url,
    publicId: initialPublicIds?.[i] ?? '',
  }));
  const [items, setItems] = useState<Item[]>(initial);
  const [showAdder, setShowAdder] = useState(false);

  function add(url: string, publicId: string) {
    if (!url) return;
    setItems((prev) => [...prev, { url, publicId }]);
    setShowAdder(false);
  }

  function remove(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  }

  const urls = items.map((it) => it.url);
  const publicIds = items.map((it) => it.publicId);

  return (
    <div className="space-y-3">
      {items.length === 0 && (
        <p className="text-xs text-gray-500 italic">No gallery images yet.</p>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((item, i) => (
            <div
              key={`${item.url}-${i}`}
              className="relative aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group"
            >
              {/* Use plain img for unknown-domain Cloudinary URLs that may
                  not be in next.config remotePatterns yet — keep render
                  resilient at edit time. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={`Gallery item ${i + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 flex items-center justify-between gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move left"
                    className="p-1 text-white/90 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <ArrowUp size={14} className="-rotate-90" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    aria-label="Move right"
                    className="p-1 text-white/90 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <ArrowDown size={14} className="-rotate-90" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`Remove gallery item ${i + 1}`}
                  className="p-1 text-white/90 hover:text-red-300 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdder ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50/60">
          <p className="text-xs text-gray-600 mb-2">
            Upload an image — added to the gallery after the upload completes.
          </p>
          <ImageUploader
            kind="lab-image"
            name="_galleryNew"
            aspectRatio="wide"
            onChange={(url, publicId) => {
              if (url) add(url, publicId);
            }}
          />
          <button
            type="button"
            onClick={() => setShowAdder(false)}
            className="mt-2 text-xs text-gray-600 hover:text-gray-900 underline"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdder(true)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
        >
          <Plus size={14} /> Add gallery image
        </button>
      )}

      {/* Hidden serialized arrays */}
      <input type="hidden" name={urlsName} value={JSON.stringify(urls)} />
      <input type="hidden" name={publicIdsName} value={JSON.stringify(publicIds)} />
    </div>
  );
}
