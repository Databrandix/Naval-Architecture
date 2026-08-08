// Phase 15 — admin override. Returning null shuts off the public
// BrandedLoader fallback for /admin/* (the public loader would be
// out of place inside the admin chrome). Admin navigation gets the
// native instant transition.
export default function AdminLoading() {
  return null;
}
