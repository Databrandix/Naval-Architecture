import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import JourneyCTASection from '@/components/sections/JourneyCTASection';
import InitialSplash from '@/components/common/InitialSplash';
import PublicNavigationOverlay from '@/components/common/PublicNavigationOverlay';
import { HomeHrefProvider } from '@/components/layout/HomeHrefProvider';
import PageFadeWrapper from '@/components/layout/PageFadeWrapper';
import {
  getDepartmentIdentity,
  getUniversityIdentity,
  getJourneyCTAContent,
  getTopLinks,
  getQuickAccessItems,
  getMainNav,
  getFooterUsefulLinks,
  getFooterGetInTouchLinks,
  getFooterQuickLinks,
  getFooterLegalLinks,
  getFooterCampusLinks,
} from '@/lib/identity';
import { getSearchIndex } from '@/lib/search-index';
import { sanitizeHtml } from '@/lib/sanitize-html';

// Phase 18 — universal ISR for the (public)/ subtree.
//   - revalidate: 1 hour wall-time safety net. Admin save actions
//     already call revalidatePath('/affected-route') for explicit
//     invalidation (every Phase 0+ admin action), so the hour
//     mainly catches any path we forget to revalidate.
//   - Cascades to every child page unless a page overrides with
//     its own `export const revalidate`.
export const revalidate = 3600;

// Phase 18 — public route group layout.
//
// Wraps every public page (everything under (public)/) with the full
// site chrome: Navbar, JourneyCTASection, Footer, plus the Phase 15
// preloader components. The Phase 1 admin-vs-public conditional that
// lived in the root layout is GONE — this layout is only mounted for
// public routes, so there's no need to gate on x-pathname. Removing
// the headers() call is what makes ISR possible: route segments
// that don't read headers/cookies/searchParams can be cached at the
// Vercel Edge.
//
// All getters are React.cache-wrapped so the parallel Promise.all
// resolves to a single render-scope DB batch.
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [
    dept,
    uni,
    journeyCTA,
    topLinks,
    quickAccessItems,
    mainNav,
    usefulLinks,
    getInTouchLinks,
    quickLinks,
    legalLinks,
    campusLinks,
    searchItems,
  ] = await Promise.all([
    getDepartmentIdentity(),
    getUniversityIdentity(),
    getJourneyCTAContent(),
    getTopLinks(),
    getQuickAccessItems(),
    getMainNav(),
    getFooterUsefulLinks(),
    getFooterGetInTouchLinks(),
    getFooterQuickLinks(),
    getFooterLegalLinks(),
    getFooterCampusLinks(),
    getSearchIndex(),
  ]);

  return (
    <>
      {/* Phase 15 — Tier 2 first-visit splash. sessionStorage gates
          it to once per browser tab. */}
      <InitialSplash />
      {/* Phase 15 addendum — per-navigation overlay so the preloader
          shows on every public page transition, not just on slow
          Suspense fetches. */}
      <PublicNavigationOverlay />

      <Navbar
        logoUrl={dept.logoUrl}
        applyUrl={uni.applyUrl ?? ''}
        topLinks={topLinks}
        quickAccessItems={quickAccessItems}
        mainNav={mainNav}
        searchItems={searchItems}
        topBarSocials={{
          facebookUrl: uni.facebookUrl,
          linkedinUrl: uni.linkedinUrl,
          youtubeUrl:  uni.youtubeUrl,
        }}
      />

      {/* Phase 15 — Tier 3 page transition. The wrapper is a small
          client component using usePathname so it re-keys on every
          navigation, retriggering the 250ms opacity fade-in. */}
      <main className="flex-grow">
        <HomeHrefProvider href={uni.websiteUrl}>
          <PageFadeWrapper>{children}</PageFadeWrapper>
        </HomeHrefProvider>
      </main>

      {journeyCTA && (
        <JourneyCTASection
          heroImageUrl={journeyCTA.heroImageUrl}
          heroImagePosition={`center ${journeyCTA.heroImageVerticalPercent}%`}
          heading={journeyCTA.heading}
          // Phase 19 CP19.5 — sanitize on the server before passing into
          // the 'use client' JourneyCTASection so DOMPurify/jsdom stays
          // out of the client bundle.
          body={sanitizeHtml(journeyCTA.body)}
          primaryCtaLabel={journeyCTA.primaryCtaLabel}
          primaryCtaHref={journeyCTA.primaryCtaHref}
          primaryCtaExternal={journeyCTA.primaryCtaExternal}
          secondaryCtaLabel={journeyCTA.secondaryCtaLabel}
          secondaryCtaHref={journeyCTA.secondaryCtaHref}
          secondaryCtaExternal={journeyCTA.secondaryCtaExternal}
        />
      )}

      <Footer
        logoUrl={uni.logoUrl}
        address={uni.address}
        phones={uni.phones}
        emails={uni.emails}
        copyrightText={uni.copyrightText}
        socials={{
          facebookUrl:  uni.facebookUrl,
          instagramUrl: uni.instagramUrl,
          linkedinUrl:  uni.linkedinUrl,
          youtubeUrl:   uni.youtubeUrl,
          xUrl:         uni.xUrl,
          threadsUrl:   uni.threadsUrl,
          tiktokUrl:    uni.tiktokUrl,
          whatsappUrl:  uni.whatsappUrl,
        }}
        usefulLinks={usefulLinks}
        getInTouchLinks={getInTouchLinks}
        quickLinks={quickLinks}
        legalLinks={legalLinks}
        campusLinks={campusLinks}
      />
    </>
  );
}
