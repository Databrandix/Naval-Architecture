import { cache } from 'react';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from './auth';
import { prisma } from './db';

// ─────────────────────────────────────────────────────────────────
//  Errors
// ─────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly publicMessage: string,
  ) {
    super(publicMessage);
  }
}

// ─────────────────────────────────────────────────────────────────
//  Session helpers
// ─────────────────────────────────────────────────────────────────

// Phase 16 — React.cache dedupes the session lookup within a single
// render pass. Admin layout (authed) + every server component on the
// page that calls requireUser/getSession used to trigger one full
// Session+User DB roundtrip apiece; cross-region Vercel(iad1) ↔ Neon
// (ap-southeast-1) makes each lookup ~270ms. One render = one query
// after this change.
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function requireUser() {
  const session = await getSession();
  if (!session?.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  return session.user;
}

export async function requireSuperAdmin() {
  const user = await requireUser();
  if (user.role !== 'super_admin') {
    throw new ApiError(403, 'super_admin role required');
  }
  return user;
}

// ─────────────────────────────────────────────────────────────────
//  Safety rule: never let active super_admin count drop below 1
// ─────────────────────────────────────────────────────────────────
//
//  Call this BEFORE actions that would remove an active super_admin
//  from the active-super_admin set: delete user, deactivate user,
//  demote user from super_admin → admin. Throws 400 if no other
//  active super_admin remains.
//
//  Idempotent for "still active super_admin" actions — caller
//  should only invoke when the target IS currently an active
//  super_admin AND the action would remove them from that set.
//
export async function assertSuperAdminFloorAfterRemovingTarget(
  targetUserId: string,
) {
  const remaining = await prisma.user.count({
    where: {
      role: 'super_admin',
      isActive: true,
      id: { not: targetUserId },
    },
  });
  if (remaining < 1) {
    throw new ApiError(
      400,
      'Action blocked — the system must have at least one active super_admin at all times.',
    );
  }
}

// ─────────────────────────────────────────────────────────────────
//  Route wrapper — catches ApiError / ZodError → clean JSON 4xx,
//  everything else → 500. Returns the wrapped handler with the
//  same signature.
// ─────────────────────────────────────────────────────────────────

export type RouteHandler<Ctx = unknown> = (
  request: Request,
  context: Ctx,
) => Promise<NextResponse | Response>;

export function withErrorHandling<Ctx>(handler: RouteHandler<Ctx>): RouteHandler<Ctx> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (e) {
      if (e instanceof ApiError) {
        return NextResponse.json(
          { error: e.publicMessage },
          { status: e.status },
        );
      }
      if (e instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            issues: e.issues.map((i) => ({
              path: i.path.join('.'),
              message: i.message,
            })),
          },
          { status: 400 },
        );
      }
      // Unknown / unexpected error
      console.error('[API] Unhandled error:', e);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
      );
    }
  };
}

// ─────────────────────────────────────────────────────────────────
//  JSON body helper — reads request.json() with ZodError on
//  invalid JSON.
// ─────────────────────────────────────────────────────────────────

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, 'Request body must be valid JSON');
  }
}
