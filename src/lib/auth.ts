import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { APIError } from 'better-auth/api';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

const BCRYPT_ROUNDS = 12;

export const auth = betterAuth({
  // `prisma` is the Prisma Client Extension–extended client (see ./db.ts).
  // Its TS type is slightly wider than the bare PrismaClient that
  // prismaAdapter's signature expects; runtime behavior is identical.
  database: prismaAdapter(
    prisma as unknown as Parameters<typeof prismaAdapter>[0],
    { provider: 'postgresql' },
  ),

  // Email + password only. Every other auth surface is OFF.
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    disableSignUp: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,

    // bcryptjs per spec. Verified placement: create-context.mjs:179-180
    password: {
      hash: async (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS),
      verify: async ({ hash, password }: { hash: string; password: string }) =>
        bcrypt.compare(password, hash),
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  // Phase 19 CP19.4 — Layer A: per-IP rate limit on the email
  // sign-in endpoint. Better Auth derives the IP from request
  // headers (x-forwarded-for, etc.) and stores counters in
  // memory (per-Vercel-instance). 10 attempts per 15 min is
  // generous for a human but blocks credential-stuffing rates.
  // Layer B (per-account lockout) lives in src/lib/login-lockout.ts
  // and is enforced by the route wrapper at /api/auth/[...all].
  // `enabled: true` overrides the production-only default so
  // local testing exercises the limiter; storage stays in-memory.
  rateLimit: {
    enabled: true,
    customRules: {
      '/sign-in/email': { window: 15 * 60, max: 10 },
    },
  },

  // Teach Better Auth's typed user about our domain columns.
  // These already exist in Prisma; `input: false` keeps them out
  // of public auth-API payloads (sign-in body, etc.) so they can
  // only be set via our /api/admin/users routes.
  user: {
    additionalFields: {
      role:        { type: 'string',  required: false, input: false },
      isActive:    { type: 'boolean', required: false, input: false },
      lastLoginAt: { type: 'date',    required: false, input: false },
    },
  },

  // Block sign-in for inactive users; update lastLoginAt after success.
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { isActive: true },
          });
          if (!user?.isActive) {
            throw new APIError('FORBIDDEN', {
              message: 'Account is inactive. Contact a super-admin.',
            });
          }
        },
        after: async (session) => {
          await prisma.user.update({
            where: { id: session.userId },
            data: { lastLoginAt: new Date() },
          });
        },
      },
    },
  },

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  // Dev-only: allow local ports beyond the configured BETTER_AUTH_URL
  // so developers can switch the Next.js dev port without hitting
  // Better Auth's Origin check. Production stays strict — `baseURL`
  // alone gates origins.
  trustedOrigins:
    process.env.NODE_ENV === 'production'
      ? undefined
      : ['http://localhost:3000', 'http://localhost:3001'],
});

export type AuthSession = typeof auth.$Infer.Session;
