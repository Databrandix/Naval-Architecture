import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Never prerendered or cached. A cached 200 would keep reporting health long
// after the database stopped answering, which is the one failure this endpoint
// exists to catch.
export const dynamic = 'force-dynamic';

const noStore = { 'Cache-Control': 'no-store' };

/**
 * Deployment health probe. Called by the deploy script (deploy/auto-deploy.sh)
 * after it restarts the service, alongside a plain request to the site root:
 * the root proves Nginx and the Node process are up, this proves the process
 * can still reach its database.
 */
export async function GET() {
  try {
    // Cheapest round trip that proves the connection pool works. Deliberately
    // not a row count: any expected number is a fact about the data that has to
    // be maintained, and would start failing for reasons unrelated to health.
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch {
    // The error is swallowed on purpose. Connection failures carry the host,
    // the database name and sometimes the user in their message, and this route
    // is public. The status code is the signal; the detail is already in the
    // service log, where journalctl captures it.
    return NextResponse.json({ ok: false }, { status: 503, headers: noStore });
  }
}
