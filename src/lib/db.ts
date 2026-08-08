import { PrismaClient } from '@prisma/client';

// Strip `emailVerified` from any write to the `user` table.
// Schema deliberately omits the column; Better Auth's core would
// otherwise auto-inject `emailVerified: false` on every user create
// (defaultValue in node_modules/@better-auth/core/dist/db/get-tables.mjs:148).
// Prisma Client Extensions' `query` hook intercepts before Postgres.
// Docs: https://www.prisma.io/docs/orm/prisma-client/client-extensions/query
function stripEmailVerified<T>(data: T): T {
  if (data && typeof data === 'object' && 'emailVerified' in data) {
    const { emailVerified: _ignored, ...rest } = data as Record<string, unknown>;
    return rest as T;
  }
  return data;
}

// Phase 18 — augment DATABASE_URL with a higher connection_limit /
// pool_timeout so Vercel's static-generation pass doesn't exhaust the
// 3-connection pgbouncer default. Static pre-rendering 28+ public
// pages in parallel, each calling 11 layout-level queries through
// cross-region Vercel(iad1) ↔ Neon(ap-southeast-1) latency, was
// running into PrismaClientKnownRequestError P2024 (pool timeout).
// 15 connections + 20s timeout gives the build comfortable headroom;
// the pgbouncer pooler endpoint can multiplex without issue.
function augmentDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  const extra = 'connection_limit=15&pool_timeout=20';
  return url.includes('?') ? `${url}&${extra}` : `${url}?${extra}`;
}

const basePrismaClient = () =>
  new PrismaClient({
    datasources: { db: { url: augmentDatabaseUrl() ?? '' } },
  }).$extends({
    name: 'strip-email-verified',
    query: {
      user: {
        async create({ args, query }) {
          args.data = stripEmailVerified(args.data);
          return query(args);
        },
        async update({ args, query }) {
          args.data = stripEmailVerified(args.data);
          return query(args);
        },
        async updateMany({ args, query }) {
          args.data = stripEmailVerified(args.data);
          return query(args);
        },
        async upsert({ args, query }) {
          args.create = stripEmailVerified(args.create);
          args.update = stripEmailVerified(args.update);
          return query(args);
        },
      },
    },
  });

type ExtendedPrismaClient = ReturnType<typeof basePrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma?: ExtendedPrismaClient;
};

export const prisma: ExtendedPrismaClient =
  globalForPrisma.prisma ?? basePrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
