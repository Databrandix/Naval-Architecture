import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import {
  requireUser,
  withErrorHandling,
  readJson,
  ApiError,
} from '@/lib/auth-server';
import { facultyCreateSchema, FacultyType } from '@/lib/validation';

// GET /api/admin/faculty?type=full_time
//   List all faculty ordered by displayOrder asc. Optional ?type
//   filter restricts to one of the FacultyType enum values.
export const GET = withErrorHandling(async (request) => {
  await requireUser();

  const url = new URL(request.url);
  const typeParam = url.searchParams.get('type');
  const where = typeParam
    ? { type: FacultyType.parse(typeParam) }
    : undefined;

  const faculty = await prisma.faculty.findMany({
    where,
    orderBy: { displayOrder: 'asc' },
  });
  return NextResponse.json({ faculty });
});

// POST /api/admin/faculty
//   Create a new faculty row. Atomic Dean/Head swap if either flag
//   is set in the payload.
export const POST = withErrorHandling(async (request) => {
  await requireUser();
  const body = await readJson(request);
  const parsed = facultyCreateSchema.parse(body);

  let displayOrder = parsed.displayOrder;
  if (displayOrder === undefined) {
    const last = await prisma.faculty.findFirst({
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });
    displayOrder = (last?.displayOrder ?? -1) + 1;
  }

  function asJson(v: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    return v == null ? Prisma.JsonNull : (v as Prisma.InputJsonValue);
  }

  try {
    const faculty = await prisma.$transaction(async (tx) => {
      if (parsed.isDean) {
        await tx.faculty.updateMany({
          where: { isDean: true },
          data: { isDean: false },
        });
      }
      if (parsed.isHead) {
        await tx.faculty.updateMany({
          where: { isHead: true },
          data: { isHead: false },
        });
      }
      return tx.faculty.create({
        data: {
          slug:           parsed.slug,
          name:           parsed.name,
          designation:    parsed.designation,
          secondaryTitle: parsed.secondaryTitle ?? null,
          badge:          parsed.badge ?? null,
          type:           parsed.type,
          displayOrder,
          photoUrl:       parsed.photoUrl ?? null,
          photoPublicId:  parsed.photoPublicId ?? null,
          email:          parsed.email && parsed.email !== '' ? parsed.email : null,
          phone:          parsed.phone ?? null,
          suId:           parsed.suId ?? null,
          officeAddress:  parsed.officeAddress ?? null,
          personalInfo:          asJson(parsed.personalInfo),
          academicQualification: asJson(parsed.academicQualification),
          trainingExperience:    asJson(parsed.trainingExperience),
          teachingArea:          asJson(parsed.teachingArea),
          publications:          asJson(parsed.publications),
          research:              asJson(parsed.research),
          awards:                asJson(parsed.awards),
          membership:            asJson(parsed.membership),
          previousEmployment:    asJson(parsed.previousEmployment),
          isDean:                parsed.isDean ?? false,
          isHead:                parsed.isHead ?? false,
          messageOverline:       parsed.messageOverline ?? null,
          messageHeading:        parsed.messageHeading ?? null,
          messageParagraphs:     parsed.messageParagraphs ?? [],
          messagePhotoUrl:       parsed.messagePhotoUrl ?? null,
          messagePhotoPublicId:  parsed.messagePhotoPublicId ?? null,
          messageTitleLine1:     parsed.messageTitleLine1 ?? null,
          messageTitleLine2:     parsed.messageTitleLine2 ?? null,
          messageHeroImageUrl:   parsed.messageHeroImageUrl ?? null,
          messageHeroImagePublicId: parsed.messageHeroImagePublicId ?? null,
          messageHeroImageVerticalPercent: parsed.messageHeroImageVerticalPercent,
        },
      });
    });
    return NextResponse.json({ faculty }, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === 'P2002') {
      throw new ApiError(409, `Slug "${parsed.slug}" already in use`);
    }
    throw e;
  }
});
