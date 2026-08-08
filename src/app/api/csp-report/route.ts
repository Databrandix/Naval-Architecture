import { NextResponse, type NextRequest } from 'next/server';

// Phase 19 CP19.6 — Content-Security-Policy violation telemetry.
//
// Browsers POST violation reports here when a CSP directive is
// breached (Report-Only mode: report but don't block). Two payload
// shapes both supported below:
//
//   Legacy `report-uri` (Content-Type: application/csp-report):
//     { "csp-report": {
//         "document-uri": "...",
//         "referrer": "...",
//         "violated-directive": "img-src",
//         "blocked-uri": "...",
//         "source-file": "...",
//         "line-number": 42,
//       } }
//
//   Modern Reporting API (Content-Type: application/reports+json):
//     [ { "type": "csp-violation",
//         "url": "...",
//         "body": {
//           "documentURL": "...", "blockedURL": "...",
//           "effectiveDirective": "img-src",
//           "referrer": "...", "sourceFile": "...",
//           "lineNumber": 42,
//         } } ]
//
// Endpoint behaviour:
//   - Always returns 204, even on parse failure — best-effort
//     logging, never block the reporter.
//   - In-memory per-IP rate limit (~60 reports / minute) keeps a
//     single misbehaving client from flooding Vercel logs.
//   - Logs go to console (Vercel function logs). No DB write —
//     Phase 19 deploy stays lean; observation period intentionally
//     uses Vercel's own log retention.

interface RateEntry {
  count: number;
  windowStartMs: number;
}

const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 60;
const RATE_PRUNE_EVERY = 200;

const rateStore = new Map<string, RateEntry>();
let opCounter = 0;

function shouldAccept(key: string): boolean {
  const now = Date.now();
  opCounter += 1;
  if (opCounter >= RATE_PRUNE_EVERY) {
    opCounter = 0;
    for (const [k, v] of rateStore) {
      if (now - v.windowStartMs >= RATE_WINDOW_MS) rateStore.delete(k);
    }
  }
  const entry = rateStore.get(key);
  if (!entry || now - entry.windowStartMs >= RATE_WINDOW_MS) {
    rateStore.set(key, { count: 1, windowStartMs: now });
    return true;
  }
  if (entry.count >= RATE_MAX) return false;
  entry.count += 1;
  return true;
}

function clientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return request.headers.get('x-real-ip')?.trim() || 'no-ip';
}

interface NormalizedReport {
  directive?: string;
  blockedUri?: string;
  documentUri?: string;
  referrer?: string;
  sourceFile?: string;
  lineNumber?: number;
}

function normalize(parsed: unknown): NormalizedReport[] {
  if (!parsed) return [];

  // Legacy single-report shape: { "csp-report": { ... } }
  if (typeof parsed === 'object' && parsed !== null && 'csp-report' in parsed) {
    const r = (parsed as { 'csp-report'?: Record<string, unknown> })['csp-report'] ?? {};
    return [{
      directive:   stringField(r, 'violated-directive') ?? stringField(r, 'effective-directive'),
      blockedUri:  stringField(r, 'blocked-uri'),
      documentUri: stringField(r, 'document-uri'),
      referrer:    stringField(r, 'referrer'),
      sourceFile:  stringField(r, 'source-file'),
      lineNumber:  numberField(r, 'line-number'),
    }];
  }

  // Modern Reporting API: array of report objects.
  if (Array.isArray(parsed)) {
    const out: NormalizedReport[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') continue;
      const body = (item as { body?: Record<string, unknown> }).body ?? {};
      out.push({
        directive:   stringField(body, 'effectiveDirective') ?? stringField(body, 'violatedDirective'),
        blockedUri:  stringField(body, 'blockedURL'),
        documentUri: stringField(body, 'documentURL'),
        referrer:    stringField(body, 'referrer'),
        sourceFile:  stringField(body, 'sourceFile'),
        lineNumber:  numberField(body, 'lineNumber'),
      });
    }
    return out;
  }

  return [];
}

function stringField(o: Record<string, unknown>, key: string): string | undefined {
  const v = o[key];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function numberField(o: Record<string, unknown>, key: string): number | undefined {
  const v = o[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = clientIp(request);
  if (!shouldAccept(`csp-report:${ip}`)) {
    return new NextResponse(null, { status: 204 });
  }

  let parsed: unknown = null;
  try {
    parsed = await request.json();
  } catch {
    // Malformed body — accept silently per best-effort policy.
    return new NextResponse(null, { status: 204 });
  }

  const reports = normalize(parsed);
  const userAgent = request.headers.get('user-agent') ?? null;
  const ts = new Date().toISOString();

  for (const report of reports) {
    console.log(
      '[csp-report]',
      JSON.stringify({
        timestamp:   ts,
        directive:   report.directive,
        blockedUri:  report.blockedUri,
        documentUri: report.documentUri,
        referrer:    report.referrer,
        sourceFile:  report.sourceFile,
        lineNumber:  report.lineNumber,
        userAgent,
      }),
    );
  }

  return new NextResponse(null, { status: 204 });
}
