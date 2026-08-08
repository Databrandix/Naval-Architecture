import BrandedLoader from '@/components/common/BrandedLoader';

// Phase 15 — Tier 1 default route-segment loading UI.
// App Router renders this during real Suspense / data-fetch waits.
// /admin/* overrides this with its own loading.tsx that returns null,
// so the public branded loader never appears on admin routes.
export default function Loading() {
  return <BrandedLoader />;
}
