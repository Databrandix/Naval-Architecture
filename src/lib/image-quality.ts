// Phase 14 — Cloudinary delivery quality presets.
//
// Storage layer is ALWAYS original (see src/lib/cloudinary.ts —
// signUploadParams passes no `format` / transformation params). The
// "quality preference" admins pick per upload is realised by
// inserting a transformation segment into the Cloudinary delivery
// URL between `/upload/` and `/v<version>/...`, BEFORE the URL is
// saved to the DB. The DB stores the final delivery URL verbatim,
// so renderers do not need to know about presets — they read the
// stored URL and serve it as-is.
//
// Existing pre-Phase-14 assets have no transformation segment in
// their stored URL and continue to serve original (current behaviour
// preserved). Phase 14 affects NEW uploads only.

export type ImageQualityPreset = 'original' | 'auto' | 'auto_compact';

export const IMAGE_QUALITY_PRESET_LABELS: Record<ImageQualityPreset, string> = {
  original:     'Original',
  auto:         'Auto-optimized',
  auto_compact: 'Maximum compression',
};

// Cloudinary transformation strings inserted between `/upload/` and
// `/v<version>/...`. `original` = empty = URL unchanged.
//   f_auto         → on-demand format negotiation (AVIF/WebP/JPEG)
//   q_auto:good    → balanced quality (recommended for photos)
//   q_auto:eco     → aggressive compression (smaller files)
const PRESET_TRANSFORMATIONS: Record<ImageQualityPreset, string> = {
  original:     '',
  auto:         'f_auto,q_auto:good',
  auto_compact: 'f_auto,q_auto:eco',
};

export const DEFAULT_IMAGE_QUALITY_PRESET: ImageQualityPreset = 'auto';

// Matches a fresh Cloudinary delivery URL of the shape:
//   https://res.cloudinary.com/<cloud>/<image|video|raw>/upload/v<digits>/<rest>
// — i.e. one returned by /auto/upload BEFORE any transformation
// segment has been inserted.
const FRESH_UPLOAD_URL =
  /^(https:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|video|raw)\/upload\/)(v\d+\/.+)$/;

export function applyDeliveryTransformation(
  secureUrl: string,
  preset: ImageQualityPreset,
): string {
  const segment = PRESET_TRANSFORMATIONS[preset];
  if (!segment) return secureUrl;
  const match = secureUrl.match(FRESH_UPLOAD_URL);
  if (!match) return secureUrl;
  const [, prefix, tail] = match;
  return `${prefix}${segment}/${tail}`;
}
