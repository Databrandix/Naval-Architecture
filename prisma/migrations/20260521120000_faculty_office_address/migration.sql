-- Phase 20.x — per-faculty office address override. Nullable; when
-- NULL the public faculty page falls back to the shared
-- UniversityIdentity.address. Backward-compatible: existing rows stay
-- NULL and render the institutional default exactly as before.
ALTER TABLE "faculty" ADD COLUMN "officeAddress" TEXT;
