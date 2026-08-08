import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson, ApiError } from '@/lib/auth-server';
import { faqUpdateSchema } from '@/lib/validation';

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(async (_request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  const faq = await prisma.faq.findUnique({ where: { id } });
  if (!faq) throw new ApiError(404, 'FAQ not found');
  return NextResponse.json({ faq });
});

export const PUT = withErrorHandling(async (request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  const body = await readJson(request);
  const data = faqUpdateSchema.parse(body);
  try {
    const faq = await prisma.faq.update({ where: { id }, data });
    return NextResponse.json({ faq });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') throw new ApiError(404, 'FAQ not found');
    throw e;
  }
});

export const DELETE = withErrorHandling(async (_request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  try {
    await prisma.faq.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') throw new ApiError(404, 'FAQ not found');
    throw e;
  }
});
