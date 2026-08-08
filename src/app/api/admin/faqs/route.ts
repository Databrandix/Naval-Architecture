import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUser, withErrorHandling, readJson } from '@/lib/auth-server';
import { faqCreateSchema } from '@/lib/validation';

export const GET = withErrorHandling(async () => {
  await requireUser();
  const faqs = await prisma.faq.findMany({ orderBy: { displayOrder: 'asc' } });
  return NextResponse.json({ faqs });
});

export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = faqCreateSchema.parse(body);
  const last = await prisma.faq.findFirst({ orderBy: { displayOrder: 'desc' }, select: { displayOrder: true } });
  const displayOrder = (last?.displayOrder ?? -1) + 1;
  const faq = await prisma.faq.create({ data: { ...parsed, displayOrder } });
  return NextResponse.json({ faq }, { status: 201 });
});
