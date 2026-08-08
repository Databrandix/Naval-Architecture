// Phase 16 CP16.4 — inline admin loader. Shows in the <main> area
// of the (authed) layout while a page's data is in flight; the
// sidebar stays visible so chrome paints instantly on every
// intra-admin navigation. Reuses the Phase 15 dot-ellipsis keyframes
// from globals.css.
//
// Scoped to the (authed) route group only — admin/login does not
// inherit (src/app/admin/loading.tsx still returns null and blocks
// the public BrandedLoader from leaking into the admin shell).
export default function AuthedAdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading"
        className="relative w-20 h-4"
      >
        <span className="ellipsis-grow   absolute left-2  top-1 block w-3 h-3 rounded-full bg-primary" />
        <span className="ellipsis-slide  absolute left-2  top-1 block w-3 h-3 rounded-full bg-primary" />
        <span className="ellipsis-slide  absolute left-8  top-1 block w-3 h-3 rounded-full bg-accent" />
        <span className="ellipsis-shrink absolute left-14 top-1 block w-3 h-3 rounded-full bg-accent" />
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  );
}
