import type { NextConfig } from 'next';

// Phase 19 CP19.3 — security response headers applied to every route.
// COEP intentionally omitted: it would require every cross-origin
// resource (Cloudinary images, Google Fonts) to send a permissive
// CORP header, which they don't, so enabling it would break image
// loading site-wide.
//
// Phase 19 CP19.6 — Content-Security-Policy shipped in Report-Only
// mode initially. Browsers report violations to /api/csp-report but
// do NOT block; gives 1-2 weeks of production observation before the
// follow-up Enforce switch. `frame-ancestors 'none'` is the one
// directive browsers enforce even in Report-Only (spec quirk), so
// clickjacking protection is live immediately.
//
// Allowlist rationale:
//   - script/style 'unsafe-inline' — Next.js hydration + React
//     inline-style props; XSS surface closed at write+read by CP19.5
//     sanitizer, so inline directives don't open a new attack class.
//   - img-src + Cloudinary CDN — sole image source in production.
//     Unsplash / picsum (dev-leftover from next.config.ts remote-
//     Patterns) intentionally EXCLUDED so Report-Only flags any
//     stray usage instead of silently allowing it.
//   - frame-src — Footer Google Maps embed only.
//   - font-src 'self' data: — next/font/google self-hosts to /_next/
//     static/fonts at build time, no Google Fonts CDN runtime fetch.
const csp = (frameAncestors: string) => [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-src 'self' https://www.google.com https://maps.google.com",
  `frame-ancestors ${frameAncestors}`,
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
  "report-uri /api/csp-report",
].join('; ');

const cspReportOnly = csp("'none'");

/**
 * Bundled PDFs are the one thing this site frames in its own pages — the
 * prospectus reader on /admission/prospectus opens the document in place
 * rather than sending the reader to a new tab.
 *
 * Site-wide `X-Frame-Options: DENY` and `frame-ancestors 'none'` blocked
 * that, and browsers enforce frame-ancestors even from a Report-Only policy,
 * so the frame came up as Chrome's "refused to connect" box.
 *
 * Relaxing it for these files only costs nothing: clickjacking works by
 * framing an interactive page and steering a click into an action carried by
 * the visitor's session. A static PDF has no such controls, and the exception
 * is same-origin, so another site still cannot frame these. Every HTML route
 * keeps DENY.
 */
const framablePdfHeaders = [
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Content-Security-Policy-Report-Only', value: csp("'self'") },
];

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'X-Frame-Options',           value: 'DENY' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), ' +
      'magnetometer=(), gyroscope=(), accelerometer=(), interest-cohort=()',
  },
  { key: 'X-DNS-Prefetch-Control',         value: 'on' },
  { key: 'Cross-Origin-Opener-Policy',     value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy',   value: 'same-origin' },
  { key: 'Content-Security-Policy-Report-Only', value: cspReportOnly },
];

const nextConfig: NextConfig = {
  // Phase 19 CP19.3 — strip the default "X-Powered-By: Next.js"
  // header so attackers can't fingerprint the framework from a
  // simple HEAD request.
  poweredByHeader: false,
  // motion v12 CJS/ESM interop with Webpack — transpilePackage
  // ensures the library is processed by next-swc/swc-loader so
  // shared chunks created by dynamic imports resolve correctly.
  transpilePackages: ['motion'],
  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      // Cloudinary CDN — admin CMS uploads land here (folder isolation
      // via CLOUDINARY_UPLOAD_FOLDER); covers any cloud name so clones
      // for sibling departments don't need a config tweak.
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/assets/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Security headers — applied to every route. Next.js merges
      // headers across matching rules, so the cache rules above keep
      // their Cache-Control while picking up this set as well.
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Last, so it overrides the two frame headers set above for these
      // files only. See framablePdfHeaders for why that is safe.
      {
        source: '/assets/:file(.*\\.pdf)',
        headers: framablePdfHeaders,
      },
    ];
  },
};

export default nextConfig;
