import type { Metadata } from 'next';
import { Poppins, Montserrat, Hind_Siliguri } from 'next/font/google';
import { getDepartmentIdentity } from '@/lib/identity';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-montserrat',
  display: 'swap',
});

const hindSiliguri = Hind_Siliguri({
  subsets: ['latin', 'bengali'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hind-siliguri',
  display: 'swap',
});

/**
 * Site-wide names and the canonical URL.
 *
 * These are the strings a search result and a shared link show, and they were
 * written into this file — so a copy of this codebase announced itself as the
 * department it was copied from, at an address belonging to that department's
 * site. The URL now comes from the environment (set NEXT_PUBLIC_SITE_URL in
 * Vercel); the names are the one place left to edit when starting a new
 * department site, and they are together, at the top, for that reason.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const DEPARTMENT_NAME = 'Naval Architecture and Marine Engineering';
const SITE_NAME = `Sonargaon University — ${DEPARTMENT_NAME} Department`;
const SITE_DESCRIPTION =
  'Department of Naval Architecture and Marine Engineering at Sonargaon University — the first and only private university department in Bangladesh offering a B.Sc. in Naval Architecture and Marine Engineering. Programs, faculty, research, laboratories, admissions and campus services.';
const OG_IMAGE = '/assets/og-banner.webp';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s — Sonargaon University ${DEPARTMENT_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: `Sonargaon University — Department of ${DEPARTMENT_NAME}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

// Phase 18 — minimal root layout. The previous root layout pulled in
// the admin-vs-public chrome conditional via `headers()` to read
// x-pathname, which forced every public route into dynamic rendering
// and blocked ISR. Chrome rendering now lives in the (public)/ and
// admin/ route group layouts; this root layout only sets up the
// HTML shell, fonts, and the DB-driven brand-color CSS vars on
// <html>. getDepartmentIdentity is React.cache-wrapped and a plain
// DB query, so it does NOT force dynamic rendering — the resulting
// brand vars are baked into the ISR cache for public routes.
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dept = await getDepartmentIdentity();
  const brandVars = {
    '--color-primary': dept.primaryColor,
    '--color-accent': dept.accentColor,
    '--color-button-yellow': dept.buttonColor,
  } as React.CSSProperties;

  return (
    <html
      lang="en"
      className={`${poppins.variable} ${montserrat.variable} ${hindSiliguri.variable}`}
      style={brandVars}
    >
      <body className="min-h-screen flex flex-col selection:bg-accent/30">
        {children}
      </body>
    </html>
  );
}
