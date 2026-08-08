'use client';

import { useId, useRef, useState } from 'react';
import { FileText, ImageOff, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  DEFAULT_IMAGE_QUALITY_PRESET,
  IMAGE_QUALITY_PRESET_LABELS,
  applyDeliveryTransformation,
  type ImageQualityPreset,
} from '@/lib/image-quality';

type Kind =
  | 'department-logo'
  | 'department-hero'
  | 'university-logo'
  | 'program-image'
  | 'research-icon'
  | 'faculty-photo'
  | 'faculty-message-hero'
  | 'about-image'
  | 'lab-image'
  // Phase 6
  | 'news-cover'
  | 'event-image'
  | 'notice-file'
  | 'gallery-image'
  // Phase 7
  | 'alumni-photo'
  | 'club-image'
  | 'visitor-photo'
  | 'syllabus-cover'
  | 'syllabus-pdf'
  // Phase 8a
  | 'admission-notice-hero'
  | 'admission-notice-file'
  | 'prospectus-cover'
  | 'prospectus-pdf'
  // Phase 10
  | 'contact-hero'
  // Phase 12
  | 'journey-cta-hero'
  // Phase 17
  | 'legal-hero'
  | 'department-layout-cover'
  | 'department-layout-pdf';

// Per-kind ideal upload size hint, surfaced under every image field
// so admins have a target before opening the file picker. null = no
// hint (e.g. PDF-only uploads where pixel dimensions don't apply).
// Per-call sites can override via the `recommendedSize` prop.
const RECOMMENDED_SIZE_BY_KIND: Record<Kind, string | null> = {
  'department-logo':       'Square / horizontal logo · transparent PNG · ~512×512',
  'department-hero':       'Landscape banner · 1920×600 (16:5) recommended',
  'university-logo':       'Horizontal logo · transparent PNG · ~600×200',
  'program-image':         'Landscape · 1200×675 (16:9)',
  'research-icon':         'Square · 400×400',
  'faculty-photo':         'Square portrait · 600×600 minimum',
  'faculty-message-hero':  'Landscape banner · 1920×600 (16:5)',
  'about-image':           'Landscape · 1920×600 (16:5) for hero use',
  'lab-image':             'Landscape · 1600×900 (16:9)',
  'news-cover':            'Landscape · 1600×1000 (16:10)',
  'event-image':           'Landscape · 1600×1000 (16:10)',
  'notice-file':           'PDF preferred · or 1200×1600 portrait image',
  'gallery-image':         'Long side ≥1600 px · any aspect ratio',
  'alumni-photo':          'Square portrait · 400×400',
  'club-image':            'Landscape · 1200×675 (16:9)',
  'visitor-photo':         'Square portrait · 400×400',
  'syllabus-cover':        'Portrait · 800×1131 (A4 ratio)',
  'syllabus-pdf':          null,
  'admission-notice-hero': 'Landscape banner · 1920×600',
  'admission-notice-file': null,
  'prospectus-cover':      'Portrait · 800×1131 (A4 ratio)',
  'prospectus-pdf':        null,
  'contact-hero':          'Landscape banner · 1920×500',
  'journey-cta-hero':      'Landscape · 1920×800',
  'legal-hero':            'Landscape banner · 1920×500',
  'department-layout-cover': 'Portrait / landscape · 1200×1600 recommended',
  'department-layout-pdf':   null,
};

export type UploadMeta = {
  fileType: 'image' | 'pdf';
  fileName: string;
  /** Cloudinary returns width/height on image uploads (raw PDFs may omit). */
  width?: number;
  height?: number;
};

type Props = {
  /** Which folder + transformation hint the upload goes to. */
  kind: Kind;
  /** Base name for the two hidden inputs: `${name}Url` and `${name}PublicId`. */
  name: string;
  initialUrl?: string | null;
  initialPublicId?: string | null;
  /**
   * Initial file metadata. Only relevant for kinds that may carry a PDF
   * (currently 'notice-file'); ignored otherwise. Phase 6.
   */
  initialFileType?: 'image' | 'pdf' | null;
  initialFileName?: string | null;
  label?: string;
  aspectRatio?: 'square' | 'wide' | 'auto';
  /**
   * Override the per-kind default size hint shown under the uploader.
   * Pass null to suppress the hint entirely (useful for the rare
   * field where the default doesn't fit).
   */
  recommendedSize?: string | null;
  /**
   * Accept attribute for the underlying <input type="file">. Default
   * 'image/*' preserves Phase 0-5 behaviour. Phase 6 'notice-file'
   * uploads pass 'image/*,application/pdf' so the picker shows both.
   */
  accept?: string;
  /**
   * When provided, hidden form inputs are skipped and the callback
   * fires on upload/clear. Use for image uploads embedded inside
   * Json-array editors (Phase 4 ActivitiesEditor) where the parent
   * serializes the whole array as a single hidden input.
   *
   * Phase 6 adds an optional `meta` 3rd arg so Notice forms can surface
   * fileType ('image' | 'pdf') and the original filename. Existing
   * callers that only accept (url, publicId) keep working unchanged.
   */
  onChange?: (url: string, publicId: string, meta?: UploadMeta) => void;
};

export default function ImageUploader({
  kind,
  name,
  initialUrl,
  initialPublicId,
  initialFileType,
  initialFileName,
  label,
  aspectRatio = 'auto',
  accept = 'image/*',
  recommendedSize,
  onChange,
}: Props) {
  // Resolve hint: explicit override (including `null` to suppress)
  // wins over the per-kind default.
  const sizeHint =
    recommendedSize !== undefined ? recommendedSize : RECOMMENDED_SIZE_BY_KIND[kind];
  const [url, setUrl] = useState<string>(initialUrl ?? '');
  const [publicId, setPublicId] = useState<string>(initialPublicId ?? '');
  const [fileType, setFileType] = useState<'image' | 'pdf'>(
    initialFileType ?? 'image',
  );
  const [fileName, setFileName] = useState<string>(initialFileName ?? '');
  const [uploading, setUploading] = useState(false);
  // Phase 14 — per-upload delivery quality preset. Default 'auto'
  // (f_auto,q_auto:good) covers ~95% of photo uploads. Admins switch
  // to 'original' for logos / diagrams / text-heavy images where
  // compression artefacts matter. The preset chosen BEFORE upload
  // gets baked into the secure_url before it's saved to the DB; the
  // radio is interactive after upload too but only affects the NEXT
  // upload (existing URL is locked).
  const [quality, setQuality] = useState<ImageQualityPreset>(
    DEFAULT_IMAGE_QUALITY_PRESET,
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const qualityGroupId = useId();
  // Hide the quality radio when the form is PDF-only — f_auto/q_auto
  // have no useful effect on PDFs. Mixed image+pdf forms (e.g. Phase 6
  // notice-file) keep the radio because images go through it.
  const showQuality = accept !== 'application/pdf';

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // 1. Get signed Cloudinary params from our server
      const signRes = await fetch('/api/admin/uploads/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
      });
      if (!signRes.ok) {
        const data = await signRes.json().catch(() => ({}));
        throw new Error(data.error ?? 'Failed to sign upload');
      }
      const sign = await signRes.json();

      // 2. Upload directly to Cloudinary
      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', sign.apiKey);
      fd.append('timestamp', String(sign.timestamp));
      fd.append('folder', sign.folder);
      fd.append('signature', sign.signature);
      const upRes = await fetch(sign.uploadUrl, { method: 'POST', body: fd });
      if (!upRes.ok) {
        throw new Error('Cloudinary upload failed');
      }
      const upJson = await upRes.json();

      // Detect type from Cloudinary's `format` field (more reliable than
      // resource_type, which varies by account/plan for PDFs).
      const format = String(upJson.format ?? '').toLowerCase();
      const nextFileType: 'image' | 'pdf' = format === 'pdf' ? 'pdf' : 'image';
      const nextFileName = String(upJson.original_filename ?? file.name ?? '');

      // Phase 14 — bake the delivery-quality transformation into the
      // secure_url for images before persisting. PDFs and unrecognized
      // URLs pass through unchanged (applyDeliveryTransformation
      // returns the input as-is in those cases).
      const deliveryUrl =
        nextFileType === 'image'
          ? applyDeliveryTransformation(upJson.secure_url, quality)
          : upJson.secure_url;

      setUrl(deliveryUrl);
      setPublicId(upJson.public_id);
      setFileType(nextFileType);
      setFileName(nextFileName);
      const w = typeof upJson.width === 'number' ? upJson.width : undefined;
      const h = typeof upJson.height === 'number' ? upJson.height : undefined;
      onChange?.(deliveryUrl, upJson.public_id, {
        fileType: nextFileType,
        fileName: nextFileName,
        width: w,
        height: h,
      });
      toast.success(nextFileType === 'pdf' ? 'PDF uploaded' : 'Image uploaded');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function clearImage() {
    if (publicId) {
      // Best-effort cleanup of the now-orphaned Cloudinary asset.
      try {
        await fetch('/api/admin/uploads/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId }),
        });
      } catch {
        /* swallow — orphan cleanup is best-effort */
      }
    }
    setUrl('');
    setPublicId('');
    setFileType('image');
    setFileName('');
    onChange?.('', '', { fileType: 'image', fileName: '' });
  }

  const aspectClass =
    aspectRatio === 'square' ? 'aspect-square' :
    aspectRatio === 'wide'   ? 'aspect-[3/1]' : '';

  const isPdf = fileType === 'pdf';

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <div
        className={`relative bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg overflow-hidden ${aspectClass}`}
      >
        {url ? (
          isPdf ? (
            <div className="flex items-start gap-3 p-4">
              <div className="w-10 h-10 rounded-md bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <FileText size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-800 truncate">
                  {fileName || 'PDF document'}
                </div>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-accent hover:underline"
                >
                  Open PDF in new tab
                </a>
              </div>
              <button
                type="button"
                onClick={clearImage}
                className="bg-white/90 hover:bg-white text-gray-700 rounded-full p-1.5 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 shrink-0"
                aria-label="Remove file"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className={`w-full ${aspectRatio === 'auto' ? 'max-h-40 object-contain' : 'h-full object-cover'}`}
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-1.5 shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50"
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            </>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <ImageOff size={24} />
            <span className="text-xs mt-1">
              {accept.includes('pdf') ? 'No file' : 'No image'}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          onChange={handleFile}
          disabled={uploading}
          className="text-sm text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border file:border-gray-200 file:bg-white file:text-gray-700 file:text-sm file:font-medium hover:file:bg-gray-50 file:cursor-pointer"
        />
        {uploading && (
          <span className="text-xs text-gray-500 animate-pulse">Uploading…</span>
        )}
      </div>
      {sizeHint && (
        <p className="text-[11px] text-gray-500 leading-snug">
          <span className="font-semibold text-gray-600">Recommended size:</span>{' '}
          {sizeHint}
        </p>
      )}
      {showQuality && (
        <fieldset
          className="border border-gray-200 rounded-md p-2.5 mt-1"
          disabled={uploading}
        >
          <legend className="px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Delivery quality
          </legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
            {(['auto', 'original', 'auto_compact'] as const).map((preset) => (
              <label
                key={preset}
                className="inline-flex items-center gap-1.5 cursor-pointer"
              >
                <input
                  type="radio"
                  name={qualityGroupId}
                  value={preset}
                  checked={quality === preset}
                  onChange={() => setQuality(preset)}
                  className="accent-accent"
                />
                <span className="text-gray-700">
                  {IMAGE_QUALITY_PRESET_LABELS[preset]}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-gray-500 leading-snug">
            Auto-optimized: recommended for photos. Original: for logos,
            diagrams, or text-heavy images. Maximum compression: smaller
            files, lower quality. Choose <em>before</em> uploading.
          </p>
        </fieldset>
      )}
      {!onChange && (
        <>
          <input type="hidden" name={`${name}Url`} value={url} />
          <input type="hidden" name={`${name}PublicId`} value={publicId} />
        </>
      )}
    </div>
  );
}
