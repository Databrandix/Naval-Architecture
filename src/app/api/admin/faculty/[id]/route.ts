import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import {
  requireUser,
  withErrorHandling,
  readJson,
  ApiError,
} from '@/lib/auth-server';
import { facultyUpdateSchema } from '@/lib/validation';

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/admin/faculty/:id
export const GET = withErrorHandling(async (_request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  const faculty = await prisma.faculty.findUnique({ where: { id } });
  if (!faculty) throw new ApiError(404, 'Faculty not found');
  return NextResponse.json({ faculty });
});

// PUT /api/admin/faculty/:id
//   Partial update. Atomic Dean/Head swap if either flag is set.
export const PUT = withErrorHandling(async (request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  const body = await readJson(request);
  const data = facultyUpdateSchema.parse(body);

  function asJson(v: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    return v == null ? Prisma.JsonNull : (v as Prisma.InputJsonValue);
  }

  // Build the update object, skipping fields that weren't provided.
  // For Json fields, undefined means "leave unchanged"; null in the
  // payload means "explicitly clear", which we map to Prisma.JsonNull.
  const update: Prisma.FacultyUpdateInput = {};
  if (data.slug           !== undefined) update.slug           = data.slug;
  if (data.name           !== undefined) update.name           = data.name;
  if (data.designation    !== undefined) update.designation    = data.designation;
  if (data.secondaryTitle !== undefined) update.secondaryTitle = data.secondaryTitle ?? null;
  if (data.badge          !== undefined) update.badge          = data.badge ?? null;
  if (data.type           !== undefined) update.type           = data.type;
  if (data.photoUrl       !== undefined) update.photoUrl       = data.photoUrl ?? null;
  if (data.photoPublicId  !== undefined) update.photoPublicId  = data.photoPublicId ?? null;
  if (data.email          !== undefined) update.email          = data.email && data.email !== '' ? data.email : null;
  if (data.phone          !== undefined) update.phone          = data.phone ?? null;
  if (data.suId           !== undefined) update.suId           = data.suId ?? null;
  if (data.officeAddress  !== undefined) update.officeAddress  = data.officeAddress ?? null;
  if (data.personalInfo          !== undefined) update.personalInfo          = asJson(data.personalInfo);
  if (data.academicQualification !== undefined) update.academicQualification = asJson(data.academicQualification);
  if (data.trainingExperience    !== undefined) update.trainingExperience    = asJson(data.trainingExperience);
  if (data.teachingArea          !== undefined) update.teachingArea          = asJson(data.teachingArea);
  if (data.publications          !== undefined) update.publications          = asJson(data.publications);
  if (data.research              !== undefined) update.research              = asJson(data.research);
  if (data.awards                !== undefined) update.awards                = asJson(data.awards);
  if (data.membership            !== undefined) update.membership            = asJson(data.membership);
  if (data.previousEmployment    !== undefined) update.previousEmployment    = asJson(data.previousEmployment);
  if (data.isDean                !== undefined) update.isDean                = data.isDean;
  if (data.isHead                !== undefined) update.isHead                = data.isHead;
  if (data.messageOverline       !== undefined) update.messageOverline       = data.messageOverline ?? null;
  if (data.messageHeading        !== undefined) update.messageHeading        = data.messageHeading ?? null;
  if (data.messageParagraphs     !== undefined) update.messageParagraphs     = { set: data.messageParagraphs };
  if (data.messagePhotoUrl       !== undefined) update.messagePhotoUrl       = data.messagePhotoUrl ?? null;
  if (data.messagePhotoPublicId  !== undefined) update.messagePhotoPublicId  = data.messagePhotoPublicId ?? null;
  if (data.messageTitleLine1     !== undefined) update.messageTitleLine1     = data.messageTitleLine1 ?? null;
  if (data.messageTitleLine2     !== undefined) update.messageTitleLine2     = data.messageTitleLine2 ?? null;
  if (data.messageHeroImageUrl   !== undefined) update.messageHeroImageUrl   = data.messageHeroImageUrl ?? null;
  if (data.messageHeroImagePublicId !== undefined) update.messageHeroImagePublicId = data.messageHeroImagePublicId ?? null;
  if (data.messageHeroImageVerticalPercent !== undefined) update.messageHeroImageVerticalPercent = data.messageHeroImageVerticalPercent;

  try {
    const faculty = await prisma.$transaction(async (tx) => {
      if (data.isDean) {
        await tx.faculty.updateMany({
          where: { isDean: true, id: { not: id } },
          data: { isDean: false },
        });
      }
      if (data.isHead) {
        await tx.faculty.updateMany({
          where: { isHead: true, id: { not: id } },
          data: { isHead: false },
        });
      }
      return tx.faculty.update({ where: { id }, data: update });
    });
    return NextResponse.json({ faculty });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2025') throw new ApiError(404, 'Faculty not found');
    if (code === 'P2002') throw new ApiError(409, 'Slug already in use');
    throw e;
  }
});

// DELETE /api/admin/faculty/:id
export const DELETE = withErrorHandling(async (_request, context: RouteContext) => {
  await requireUser();
  const { id } = await context.params;
  try {
    await prisma.faculty.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2025') {
      throw new ApiError(404, 'Faculty not found');
    }
    throw e;
  }
});
