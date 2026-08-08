import { z } from 'zod';

// Hex color in #RRGGBB form
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a #RRGGBB hex color');

// Cloudinary public_id is opaque string; the URL is normally an https URL
// but we keep both as plain strings so locally-seeded assets (e.g.
// /assets/hero-1.webp) remain valid until first upload.
const nullableString = z.string().nullable();
const optionalNullableString = z.string().nullable().optional();

// ─────────────────────────────────────────────────────────────────
//  DepartmentIdentity (singleton — PUT only; GET takes no body)
// ─────────────────────────────────────────────────────────────────

export const departmentUpdateSchema = z.object({
  name:            z.string().min(1).max(200),
  shortCode:       z.string().min(1).max(20),
  facultyName:     z.string().min(1).max(200),
  primaryColor:    hexColor,
  accentColor:     hexColor,
  buttonColor:     hexColor,
  logoUrl:         z.string().min(1),
  logoPublicId:    nullableString,
  breadcrumbLabel: z.string().min(1).max(50),
  heroImage1Url:             z.string().min(1),
  heroImage1PublicId:        nullableString,
  heroImage1Alt:             optionalNullableString,
  heroImage1VerticalPercent: z.coerce.number().int().min(0).max(100).default(50),
  heroImage2Url:             z.string().min(1),
  heroImage2PublicId:        nullableString,
  heroImage2Alt:             optionalNullableString,
  heroImage2VerticalPercent: z.coerce.number().int().min(0).max(100).default(50),
  heroImage3Url:             z.string().min(1),
  heroImage3PublicId:        nullableString,
  heroImage3Alt:             optionalNullableString,
  heroImage3VerticalPercent: z.coerce.number().int().min(0).max(100).default(50),
});

// ─────────────────────────────────────────────────────────────────
//  UniversityIdentity (singleton)
// ─────────────────────────────────────────────────────────────────

const urlOrEmpty = z.string().url().or(z.literal('')).nullable();

export const universityUpdateSchema = z.object({
  name:    z.string().min(1).max(300),
  address: z.string().min(1),
  phones:  z.array(z.string().min(1)).default([]),
  emails:  z.array(z.string().email()).default([]),
  facebookUrl:  urlOrEmpty,
  instagramUrl: urlOrEmpty,
  youtubeUrl:   urlOrEmpty,
  linkedinUrl:  urlOrEmpty,
  xUrl:         urlOrEmpty,
  tiktokUrl:    urlOrEmpty,
  whatsappUrl:  urlOrEmpty,
  threadsUrl:   urlOrEmpty,
  erpUrl:       urlOrEmpty,
  applyUrl:     urlOrEmpty,
  libraryUrl:   urlOrEmpty,
  iqacUrl:      urlOrEmpty,
  careerUrl:    urlOrEmpty,
  noticeUrl:    urlOrEmpty,
  copyrightText: z.string().min(1).max(500),
  mapEmbedUrl:   z.string().nullable(),
  logoUrl:       z.string().min(1),
  logoPublicId:  nullableString,
  // Phase 9 — contact form recipient. Empty string OR valid email.
  // Empty/null = email delivery disabled; submissions still log in DB.
  contactSubmissionEmail: z.string().email().or(z.literal('')).nullable().optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

// ─────────────────────────────────────────────────────────────────
//  Program (list — CRUD + reorder)
// ─────────────────────────────────────────────────────────────────

export const programCreateSchema = z.object({
  programName:     z.string().min(1).max(300),
  degreeCode:      z.string().min(1).max(50),
  duration:        z.string().min(1).max(100),
  description:     z.string().min(1),
  displayOrder:    z.number().int().min(0).optional(), // auto-append if omitted
  imageUrl:        optionalNullableString,
  imagePublicId:   optionalNullableString,
  specializations: z.array(z.string()).default([]),
  cta:             z.string().nullable().optional(),
  ctaHref:         z.string().nullable().optional(),
});

export const programUpdateSchema = programCreateSchema.partial();

export const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

// ─────────────────────────────────────────────────────────────────
//  ResearchArea (list — CRUD + reorder)
// ─────────────────────────────────────────────────────────────────

// Base shape — kept un-refined so we can derive both create + update
// from the same source of truth without poking at Zod internals.
const researchAreaBaseShape = z.object({
  iconName:     z.string().min(1).nullable().optional(),
  iconPublicId: z.string().min(1).nullable().optional(),
  iconUrl:      z.string().min(1).nullable().optional(),
  areaName:     z.string().min(1).max(200),
  description:  z.string().nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isFeatured:           z.boolean().optional(),
  featuredHeading:      optionalNullableString,
  featuredImageUrl:     optionalNullableString,
  featuredImagePublicId: optionalNullableString,
  featuredDescription:  optionalNullableString,
  featuredCtaHref:      optionalNullableString,
});

export const researchAreaCreateSchema = researchAreaBaseShape.refine(
  (v) => {
    const lucide = !!v.iconName;
    const uploaded = !!v.iconPublicId && !!v.iconUrl;
    return (lucide ? 1 : 0) + (uploaded ? 1 : 0) === 1;
  },
  {
    message:
      'Provide exactly one of: iconName (Lucide), or (iconPublicId + iconUrl) (uploaded image).',
  },
);

export const researchAreaUpdateSchema = researchAreaBaseShape.partial().refine(
  (v: Partial<z.infer<typeof researchAreaBaseShape>>) => {
    const lucideProvided = v.iconName !== undefined;
    const uploadProvided = v.iconPublicId !== undefined && v.iconUrl !== undefined;
    if (!lucideProvided && !uploadProvided) return true;
    const lucide = !!v.iconName;
    const uploaded = !!v.iconPublicId && !!v.iconUrl;
    return (lucide ? 1 : 0) + (uploaded ? 1 : 0) === 1;
  },
  {
    message:
      'When updating the icon, provide exactly one source: iconName, or (iconPublicId + iconUrl).',
  },
);

// ─────────────────────────────────────────────────────────────────
//  Admin user management
// ─────────────────────────────────────────────────────────────────

export const Role = z.enum(['super_admin', 'admin']);

export const userCreateSchema = z.object({
  email:    z.string().email(),
  name:     z.string().min(1).max(100),
  password: z.string().min(8).max(128),
  role:     Role.default('admin'),
});

export const userUpdateSchema = z.object({
  name:     z.string().min(1).max(100).optional(),
  role:     Role.optional(),
  isActive: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(128),
});

export const changeRoleSchema = z.object({
  role: Role,
});

export const changeOwnPasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8).max(128),
});

// ─────────────────────────────────────────────────────────────────
//  Faculty (Phase 2 — list, CRUD, reorder)
// ─────────────────────────────────────────────────────────────────

// Prisma enum identifiers — underscored (no hyphens allowed).
export const FacultyType = z.enum(['leadership', 'full_time', 'part_time']);

// SectionContent items — plain string, or { text, url? } carrying a link.
const sectionItemSchema = z.union([
  z.string(),
  z.object({ text: z.string(), url: z.string().optional() }),
]);

// SectionContent — string | SectionItem[] | { heading, items }[]
const sectionContentSchema = z.union([
  z.string(),
  z.array(sectionItemSchema),
  z.array(
    z.object({ heading: z.string(), items: z.array(sectionItemSchema).default([]) }),
  ),
]);

// PersonalInfo — array of label/value rows
const personalInfoSchema = z.array(
  z.object({ label: z.string().min(1), value: z.string().min(1) }),
);

const slugRegex = /^[a-z0-9-]+$/;

export const facultyCreateSchema = z.object({
  slug:           z.string().min(1).max(120).regex(slugRegex, 'Slug must be lowercase letters, numbers, and hyphens only'),
  name:           z.string().min(1).max(300),
  designation:    z.string().min(1).max(300),
  secondaryTitle: z.string().max(300).nullable().optional(),
  badge:          z.string().max(100).nullable().optional(),
  type:           FacultyType,
  displayOrder:   z.number().int().min(0).optional(),

  photoUrl:       optionalNullableString,
  photoPublicId:  optionalNullableString,

  email:          z.string().email().nullable().optional().or(z.literal('')),
  phone:          z.string().nullable().optional(),
  suId:           z.string().nullable().optional(),
  // Optional per-faculty office address override; null/empty →
  // public page falls back to UniversityIdentity.address.
  officeAddress:  z.string().nullable().optional(),

  personalInfo:          personalInfoSchema.nullable().optional(),
  academicQualification: sectionContentSchema.nullable().optional(),
  trainingExperience:    sectionContentSchema.nullable().optional(),
  teachingArea:          sectionContentSchema.nullable().optional(),
  publications:          sectionContentSchema.nullable().optional(),
  research:              sectionContentSchema.nullable().optional(),
  awards:                sectionContentSchema.nullable().optional(),
  membership:            sectionContentSchema.nullable().optional(),
  previousEmployment:    sectionContentSchema.nullable().optional(),

  isDean:                   z.boolean().optional().default(false),
  isHead:                   z.boolean().optional().default(false),
  messageOverline:          z.string().nullable().optional(),
  messageHeading:           z.string().nullable().optional(),
  messageParagraphs:        z.array(z.string()).optional().default([]),
  messagePhotoUrl:          optionalNullableString,
  messagePhotoPublicId:     optionalNullableString,
  messageTitleLine1:        z.string().nullable().optional(),
  messageTitleLine2:        z.string().nullable().optional(),
  messageHeroImageUrl:             optionalNullableString,
  messageHeroImagePublicId:        optionalNullableString,
  messageHeroImageVerticalPercent: z.coerce.number().int().min(0).max(100).default(50),
});

export const facultyUpdateSchema = facultyCreateSchema.partial();

// ─────────────────────────────────────────────────────────────────
//  Cloudinary upload helpers
// ─────────────────────────────────────────────────────────────────

// public_id is opaque; required when deleting an asset.
export const cloudinaryDeleteSchema = z.object({
  publicId: z.string().min(1),
});

// Asset kind controls the folder + transformation hint at upload time.
export const uploadKindSchema = z.enum([
  'department-logo',
  'department-hero',
  'university-logo',
  'program-image',
  'research-icon',
  'faculty-photo',
  'faculty-message-hero',
  'about-image',
  'lab-image',
  // Phase 6
  'news-cover',
  'event-image',
  'notice-file',
  'gallery-image',
  // Phase 7
  'alumni-photo',
  'club-image',
  'visitor-photo',
  'syllabus-cover',
  'syllabus-pdf',
  // Phase 8a
  'admission-notice-hero',
  'admission-notice-file',
  'prospectus-cover',
  'prospectus-pdf',
  // Phase 10
  'contact-hero',
  // Phase 12
  'journey-cta-hero',
  // Phase 17
  'legal-hero',
  'department-layout-cover',
  'department-layout-pdf',
]);

export const uploadSignSchema = z.object({
  kind: uploadKindSchema,
});

// ─────────────────────────────────────────────────────────────────
//  Chrome link entities — Phase 3
//    All link-like tables (TopLink, FooterUseful/GetInTouch/Quick/Legal)
//    share an identical create-shape; QuickAccessItem adds iconName;
//    MainNavGroup + MainNavItem are nested.
// ─────────────────────────────────────────────────────────────────

const linkCreateBase = z.object({
  name:         z.string().min(1).max(200),
  href:         z.string().nullable().optional(),
  isExternal:   z.boolean().optional().default(false),
  isDisabled:   z.boolean().optional().default(false),
  displayOrder: z.number().int().min(0).optional(),
});

export const topLinkCreateSchema = linkCreateBase;
export const topLinkUpdateSchema = linkCreateBase.partial();

export const footerLinkCreateSchema = linkCreateBase;
export const footerLinkUpdateSchema = linkCreateBase.partial();

export const quickAccessCreateSchema = linkCreateBase.extend({
  iconName: z.string().min(1).max(100),
});
export const quickAccessUpdateSchema = quickAccessCreateSchema.partial();

export const mainNavGroupCreateSchema = z.object({
  name:         z.string().min(1).max(200),
  href:         z.string().nullable().optional(),
  hasDropdown:  z.boolean().optional().default(false),
  title:        z.string().nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
});
export const mainNavGroupUpdateSchema = mainNavGroupCreateSchema.partial();

export const mainNavItemCreateSchema = z.object({
  name:         z.string().min(1).max(200),
  href:         z.string().min(1),
  isExternal:   z.boolean().optional().default(false),
  isDisabled:   z.boolean().optional().default(false),
  displayOrder: z.number().int().min(0).optional(),
});
export const mainNavItemUpdateSchema = mainNavItemCreateSchema.partial();

// ─────────────────────────────────────────────────────────────────
//  About pages — Phase 4 (3 singletons, PUT-only schemas)
// ─────────────────────────────────────────────────────────────────

export const aboutOverviewUpdateSchema = z.object({
  heroTitle:         z.string().min(1).max(300),
  heroSubtitle:      optionalNullableString,
  heroOverline:      optionalNullableString,
  heroImageUrl:      z.string().min(1),
  heroImagePublicId: optionalNullableString,
  heroImageVerticalPercent: z.coerce.number().int().min(0).max(100).default(50),
  paragraphs:        z.array(z.string()).default([]),
});

export const aboutMissionVisionUpdateSchema = z.object({
  heroTitle:         z.string().min(1).max(300),
  heroOverline:      optionalNullableString,
  heroImageUrl:      z.string().min(1),
  heroImagePublicId: optionalNullableString,
  heroImageVerticalPercent: z.coerce.number().int().min(0).max(100).default(50),
  missionOverline:   optionalNullableString,
  missionHeading:    z.string().min(1).max(300),
  missionBody:       z.string().min(1),
  visionOverline:    optionalNullableString,
  visionHeading:     z.string().min(1).max(300),
  visionBody:        z.string().min(1),
});

// Activities + stats shapes — Json validated as structured arrays
const statsArraySchema = z.array(
  z.object({ value: z.string().min(1), label: z.string().min(1) }),
);

const activitiesArraySchema = z.array(
  z.object({
    iconName:      z.string().min(1),
    imageUrl:      z.string().min(1),
    imagePublicId: optionalNullableString,
    category:      z.string().min(1),
    title:         z.string().min(1),
    description:   z.string().min(1),
  }),
);

// ─────────────────────────────────────────────────────────────────
//  Lab systems — Phase 5 (2 singletons + 2 multi-row)
// ─────────────────────────────────────────────────────────────────

export const labFacilityLandingUpdateSchema = z.object({
  heroTitle:         z.string().min(1).max(300),
  heroOverline:      optionalNullableString,
  heroImageUrl:      z.string().min(1),
  heroImagePublicId: optionalNullableString,
  heroImageVerticalPercent: z.coerce.number().int().min(0).max(100).default(50),
  introBody:         z.string().min(1),
});

const slugRegexLab = /^[a-z0-9-]+$/;

export const labCreateSchema = z.object({
  slug:              z.string().min(1).max(120).regex(slugRegexLab, 'Slug must be lowercase letters, numbers, and hyphens only'),
  name:              z.string().min(1).max(300),
  tagline:           z.string().min(1),
  description:       z.string().min(1),
  heroImageUrl:      optionalNullableString,
  heroImagePublicId: optionalNullableString,
  gallery:           z.array(z.string()).default([]),
  galleryPublicIds:  z.array(z.string()).default([]),
  displayOrder:      z.number().int().min(0).optional(),
});

export const labUpdateSchema = labCreateSchema.partial();

const laboratoryFeaturesArraySchema = z.array(
  z.object({
    iconName:    z.string().min(1),
    title:       z.string().min(1),
    description: z.string().min(1),
  }),
);

export const laboratoryFacilityLandingUpdateSchema = z.object({
  heroTitle:         z.string().min(1).max(300),
  heroOverline:      optionalNullableString,
  heroImageUrl:      z.string().min(1),
  heroImagePublicId: optionalNullableString,
  heroImageVerticalPercent: z.coerce.number().int().min(0).max(100).default(50),
  introBody:         z.string().min(1),
  featuresOverline:  optionalNullableString,
  featuresHeading:   z.string().min(1).max(300),
  features:          laboratoryFeaturesArraySchema,
});

export const laboratoryLabCreateSchema = z.object({
  iconName:     z.string().min(1).max(100),
  title:        z.string().min(1).max(300),
  description:  z.string().min(1),
  keyLabel:     z.string().min(1).max(100),
  keyItems:     z.string().min(1),
  focus:        z.string().min(1),
  displayOrder: z.number().int().min(0).optional(),
});

export const laboratoryLabUpdateSchema = laboratoryLabCreateSchema.partial();

export const aboutDepartmentClubUpdateSchema = z.object({
  heroTitle:                z.string().min(1).max(300),
  heroOverline:             optionalNullableString,
  heroImageUrl:             z.string().min(1),
  heroImagePublicId:        optionalNullableString,
  heroImageVerticalPercent: z.coerce.number().int().min(0).max(100).default(50),
  introOverline:            optionalNullableString,
  introHeading:             z.string().min(1),
  introBody1:               z.string().min(1),
  introBody2:               z.string().min(1),
  introImageUrl:            z.string().min(1),
  introImagePublicId:       optionalNullableString,
  stats:                    statsArraySchema,
  activitiesOverline:       optionalNullableString,
  activitiesHeading:        z.string().min(1),
  activities:               activitiesArraySchema,
  networkOverline:          optionalNullableString,
  networkHeading:           z.string().min(1),
  networkBody:              z.string().min(1),
  networkPrimaryCtaLabel:   z.string().min(1),
  networkPrimaryCtaHref:    z.string().min(1),
  networkSecondaryCtaLabel: optionalNullableString,
  networkSecondaryCtaHref:  optionalNullableString,
});

// ════════════════════════════════════════════════════════════════
//  PHASE 6 — Content hubs (News, Events, Notices, Gallery)
//  Each entity has a create + update schema; update reuses create
//  via .partial() where the public render tolerates missing fields,
//  but News/Events/Notices keep the same shape on update because
//  the admin always submits the whole form.
// ════════════════════════════════════════════════════════════════

// Slug is reused across News, Event, Notice. Same rule as Phase 5.
const slugRegexHub = /^[a-z0-9-]+$/;

// {label, value}[] used by News.meta and Event.details. Server already
// parses the JSON-encoded hidden input from KeyValueListEditor, then
// passes the parsed array through this schema.
const keyValueArraySchema = z.array(
  z.object({
    label: z.string().min(1),
    value: z.string().min(1),
  }),
).default([]);

// string[] paragraph array used by News.body and Event.description.
// Empty strings are stripped server-side before parsing, so the schema
// can require non-empty entries.
const paragraphsArraySchema = z.array(z.string().min(1)).default([]);

// ─── News ────────────────────────────────────────────────────────

// ─── LegalPagesContent — Phase 17 ────────────────────────────────
// Combined singleton: one row drives /privacy-policy and
// /terms-and-conditions. Bodies stored as structured sections —
// each section is an optional heading + flat paragraphs list.
// Admin edits via SectionsEditor (prose only, no HTML markup).
export const legalSectionSchema = z.object({
  heading: z.string().trim().nullable().optional(),
  paragraphs: z
    .array(z.string().trim().min(1))
    .default([]),
});
export const legalSectionsSchema = z.array(legalSectionSchema).default([]);

export const legalPagesUpdateSchema = z.object({
  privacyHeroTitle:                z.string().min(1).max(200),
  privacyHeroOverline:             optionalNullableString,
  privacyHeroImageUrl:             z.string().min(1),
  privacyHeroImagePublicId:        optionalNullableString,
  privacyHeroImageVerticalPercent: z.coerce.number().int().min(0).max(100).default(50),
  privacySections:                 legalSectionsSchema,

  termsHeroTitle:                  z.string().min(1).max(200),
  termsHeroOverline:               optionalNullableString,
  termsHeroImageUrl:               z.string().min(1),
  termsHeroImagePublicId:          optionalNullableString,
  termsHeroImageVerticalPercent:   z.coerce.number().int().min(0).max(100).default(50),
  termsSections:                   legalSectionsSchema,
});

// /news listing page hero — singleton, mirrors the LabFacilityLanding
// shape but introBody is optional (the page body is the auto-paginated
// news grid; an intro is editorial polish, not load-bearing).
export const newsLandingUpdateSchema = z.object({
  heroTitle:         z.string().min(1).max(300),
  heroSubtitle:      optionalNullableString,
  heroOverline:      optionalNullableString,
  heroImageUrl:      z.string().min(1),
  heroImagePublicId: optionalNullableString,
  heroImageVerticalPercent: z.coerce.number().int().min(0).max(100).default(50),
  introBody:         optionalNullableString,
});

export const newsCategoryEnum = z.enum([
  'Academic',
  'Achievement',
  'Event',
  'Workshop',
  'Seminar',
  'Industrial Visit',
]);

export const newsCreateSchema = z.object({
  slug:          z.string().min(1).max(160).regex(slugRegexHub, 'Slug must be lowercase letters, numbers, and hyphens only'),
  title:         z.string().min(1).max(500),
  shortTitle:    z.string().min(1).max(300),
  category:      newsCategoryEnum,
  publishedAt:   z.coerce.date(),
  displayDate:   optionalNullableString,
  summary:       z.string().min(1),
  coverUrl:      z.string().min(1),
  coverPublicId: optionalNullableString,
  body:          paragraphsArraySchema,
  meta:          keyValueArraySchema,
});

export const newsUpdateSchema = newsCreateSchema;

// ─── Event ──────────────────────────────────────────────────────

export const eventCategoryEnum = z.enum([
  'Sports',
  'Industrial Visit',
  'Achievement',
  'Partnership',
  'Seminar',
  'Exhibition',
]);

export const eventStatusEnum = z.enum(['Past', 'Current', 'Upcoming']);

export const eventCreateSchema = z.object({
  slug:          z.string().min(1).max(160).regex(slugRegexHub, 'Slug must be lowercase letters, numbers, and hyphens only'),
  title:         z.string().min(1).max(500),
  shortTitle:    z.string().min(1).max(300),
  category:      eventCategoryEnum,
  status:        eventStatusEnum,
  // null when admin didn't fill in a structured date (e.g. "Apr 20"
  // without a year). coerce.date() handles ISO strings posted from
  // <input type="datetime-local"> / <input type="date">.
  eventDate:     z.coerce.date().nullable(),
  displayDate:   optionalNullableString,
  time:          optionalNullableString,
  venue:         optionalNullableString,
  imageUrl:      z.string().min(1),
  imagePublicId: optionalNullableString,
  summary:       z.string().min(1),
  description:   paragraphsArraySchema,
  focus:         z.string().min(1),
  details:       keyValueArraySchema,
  ctaLabel:      optionalNullableString,
  ctaHref:       optionalNullableString,
  ctaExternal:   z.boolean().default(false),
});

export const eventUpdateSchema = eventCreateSchema;

// ─── Notice ─────────────────────────────────────────────────────

export const noticeCategoryEnum = z.enum(['Academic', 'Holiday', 'Transport']);

export const noticeFileTypeEnum = z.enum(['image', 'pdf']);

export const noticeCreateSchema = z.object({
  slug:         z.string().min(1).max(160).regex(slugRegexHub, 'Slug must be lowercase letters, numbers, and hyphens only'),
  title:        z.string().min(1).max(500),
  category:     noticeCategoryEnum,
  department:   z.string().min(1).max(300),
  publishedAt:  z.coerce.date(),
  displayDate:  optionalNullableString,
  description:  z.string().min(1),
  fileUrl:      optionalNullableString,
  filePublicId: optionalNullableString,
  // fileType is set by the ImageUploader from the Cloudinary upload
  // response. Schema accepts either enum value or null/empty (no file
  // attached). Empty string from FormData is coerced to null upstream.
  fileType:     noticeFileTypeEnum.nullable().optional(),
  fileName:     optionalNullableString,
});

export const noticeUpdateSchema = noticeCreateSchema;

// ─── GalleryImage ───────────────────────────────────────────────

export const galleryImageCreateSchema = z.object({
  imageUrl:      z.string().min(1),
  imagePublicId: optionalNullableString,
  alt:           z.string().min(1).max(500),
  width:         z.number().int().min(1).max(10000),
  height:        z.number().int().min(1).max(10000),
  displayOrder:  z.number().int().min(0).optional(),
});

export const galleryImageUpdateSchema = galleryImageCreateSchema.partial();

// ════════════════════════════════════════════════════════════════
//  PHASE 7 — Student Society + Transport
//  7 multi-row entities + 1 singleton. Slug regex shared with
//  Phase 5/6 (slugRegexHub above).
// ════════════════════════════════════════════════════════════════

// ─── Alumni ─────────────────────────────────────────────────────

export const alumniCreateSchema = z.object({
  slug:          z.string().min(1).max(160).regex(slugRegexHub, 'Slug must be lowercase letters, numbers, and hyphens only'),
  studentId:     z.string().min(1).max(50),
  name:          z.string().min(1).max(300),
  department:    z.string().min(1).max(300),
  designation:   z.string().min(1).max(300),
  company:       z.string().min(1).max(500),
  photoUrl:      optionalNullableString,
  photoPublicId: optionalNullableString,
});

export const alumniUpdateSchema = alumniCreateSchema;

// ─── Club ───────────────────────────────────────────────────────

export const clubCreateSchema = z.object({
  slug:          z.string().min(1).max(160).regex(slugRegexHub, 'Slug must be lowercase letters, numbers, and hyphens only'),
  name:          z.string().min(1).max(300),
  abbreviation:  z.string().min(1).max(50),
  description:   z.string().min(1),
  imageUrl:      z.string().min(1),
  imagePublicId: optionalNullableString,
});

export const clubUpdateSchema = clubCreateSchema;

// ─── FAQ ────────────────────────────────────────────────────────

export const faqCategoryEnum = z.enum([
  'Admission',
  'Rankings',
  'Campus',
  'Programs',
  'Exams',
]);

export const faqCreateSchema = z.object({
  category: faqCategoryEnum,
  question: z.string().min(1),
  answer:   z.string().min(1),
});

export const faqUpdateSchema = faqCreateSchema;

// ─── Visitor ────────────────────────────────────────────────────

export const visitorCreateSchema = z.object({
  slug:          z.string().min(1).max(160).regex(slugRegexHub, 'Slug must be lowercase letters, numbers, and hyphens only'),
  name:          z.string().min(1).max(300),
  role:          optionalNullableString,
  affiliation:   optionalNullableString,
  photoUrl:      z.string().min(1),
  photoPublicId: optionalNullableString,
  quote:         paragraphsArraySchema,
});

export const visitorUpdateSchema = visitorCreateSchema;

// ─── ResearchPaper ──────────────────────────────────────────────

export const researchPaperCreateSchema = z.object({
  title:           z.string().min(1),
  authors:         z.string().min(1),
  area:            z.string().min(1),
  date:            optionalNullableString,
  publicationYear: z.number().int().min(1900).max(2100).nullable().optional(),
  links:           z.array(z.object({ label: z.string(), value: z.string() })).default([]),
});

export const researchPaperUpdateSchema = researchPaperCreateSchema;

// ─── BusRoute ───────────────────────────────────────────────────

const timeStringsArraySchema = z.array(z.string().min(1)).default([]);

export const busRouteCreateSchema = z.object({
  slug:           z.string().min(1).max(160).regex(slugRegexHub, 'Slug must be lowercase letters, numbers, and hyphens only'),
  routeName:      z.string().min(1).max(300),
  busNumber:      z.string().min(1).max(100),
  contact:        z.string().min(1).max(100),
  departureTimes: timeStringsArraySchema,
  returnTimes:    timeStringsArraySchema,
});

export const busRouteUpdateSchema = busRouteCreateSchema;

// ─── Syllabus ───────────────────────────────────────────────────

export const syllabusLevelEnum = z.enum(['Undergraduate', 'Postgraduate']);

export const syllabusCreateSchema = z.object({
  slug:          z.string().min(1).max(160).regex(slugRegexHub, 'Slug must be lowercase letters, numbers, and hyphens only'),
  title:         z.string().min(1).max(500),
  shortTitle:    z.string().min(1).max(300),
  department:    z.string().min(1).max(300),
  level:         syllabusLevelEnum,
  coverUrl:      z.string().min(1),
  coverPublicId: optionalNullableString,
  pdfUrl:        optionalNullableString,
  pdfPublicId:   optionalNullableString,
  pdfFileName:   optionalNullableString,
  summary:       z.string().min(1),
});

export const syllabusUpdateSchema = syllabusCreateSchema;

// ─── TransportLanding (singleton) ───────────────────────────────

// Same shape as Phase 5 LaboratoryFacility `features` so the existing
// FeaturesEditor component is reused 1:1 (constraint #4).
const transportInstructionsSchema = z.array(
  z.object({
    iconName:    z.string().min(1),
    title:       z.string().min(1),
    description: z.string().min(1),
  }),
);

export const transportLandingUpdateSchema = z.object({
  introBody:     z.string().min(1),
  bannerHeading: z.string().min(1).max(300),
  bannerBody:    z.string().min(1),
  instructions:  transportInstructionsSchema,
});

// ─────────────────────────────────────────────────────────────────
//  Phase 8a — Admission CMS Part 1 (Notices + Prospectus)
// ─────────────────────────────────────────────────────────────────

// ─── AdmissionNotice ────────────────────────────────────────────
//
// bodyParagraphs + ccList are Json string[] columns (HTML allowed for
// bodyParagraphs via dangerouslySetInnerHTML, plain text for ccList).
// Reuse paragraphsArraySchema (defined above near News).
//
const ccListSchema = z.array(z.string().min(1)).default([]);

export const admissionNoticeCreateSchema = z.object({
  slug:                 z.string().min(1).max(160).regex(slugRegexHub, 'Slug must be lowercase letters, numbers, and hyphens only'),
  title:                z.string().min(1).max(500),
  refNo:                z.string().min(1).max(200),
  subject:              z.string().min(1).max(500),
  publishedAt:          z.coerce.date(),
  displayDate:          optionalNullableString,
  headerOverline:       z.string().min(1).max(200),
  bodyParagraphs:       paragraphsArraySchema,
  signatoryPreamble:    optionalNullableString,
  signatoryName:        z.string().min(1).max(200),
  signatoryDesignation: z.string().min(1).max(200),
  ccLabel:              z.string().min(1).max(300),
  ccList:               ccListSchema,
  heroImageUrl:         optionalNullableString,
  heroImagePublicId:    optionalNullableString,
  fileUrl:              optionalNullableString,
  filePublicId:         optionalNullableString,
  fileName:             optionalNullableString,
  isActive:             z.boolean().default(true),
});

export const admissionNoticeUpdateSchema = admissionNoticeCreateSchema;

// ─── ProspectusEntry ────────────────────────────────────────────
//
// Mirrors syllabusCreateSchema shape exactly except no `summary` (the
// /admission/prospectus page renders no description per row — just
// level pill + shortTitle + department + download button).
//
export const prospectusLevelEnum = z.enum(['Undergraduate', 'Postgraduate']);

export const prospectusEntryCreateSchema = z.object({
  slug:          z.string().min(1).max(160).regex(slugRegexHub, 'Slug must be lowercase letters, numbers, and hyphens only'),
  title:         z.string().min(1).max(500),
  shortTitle:    z.string().min(1).max(300),
  department:    z.string().min(1).max(300),
  level:         prospectusLevelEnum,
  coverUrl:      z.string().min(1),
  coverPublicId: optionalNullableString,
  pdfUrl:        optionalNullableString,
  pdfPublicId:   optionalNullableString,
  pdfFileName:   optionalNullableString,
});

export const prospectusEntryUpdateSchema = prospectusEntryCreateSchema;

export const departmentLayoutCreateSchema = z.object({
  slug:          z.string().min(1).max(160).regex(slugRegexHub, 'Slug must be lowercase letters, numbers, and hyphens only'),
  title:         z.string().min(1).max(500),
  shortTitle:    z.string().min(1).max(300),
  coverUrl:      z.string().min(1),
  coverPublicId: optionalNullableString,
  pdfUrl:        optionalNullableString,
  pdfPublicId:   optionalNullableString,
  pdfFileName:   optionalNullableString,
});

export const departmentLayoutUpdateSchema = departmentLayoutCreateSchema;

// ─────────────────────────────────────────────────────────────────
//  Phase 8b — Admission CMS Part 2 (Requirements + Tuition Fees)
// ─────────────────────────────────────────────────────────────────

// ─── AdmissionRequirements (singleton) ─────────────────────────
const quickCriterionSchema = z.object({
  label: z.string().min(1).max(80),
  value: z.string().min(1).max(200),
});

export const admissionRequirementsUpdateSchema = z.object({
  intro:                     z.string().min(1),
  undergraduateRequirements: paragraphsArraySchema,
  additionalNotes:           paragraphsArraySchema,
  diplomaRequirements:       paragraphsArraySchema,
  combinedGpaBody:           z.string().min(1),
  diplomaQuickCriteria:      z.array(quickCriterionSchema).default([]),
});

// ─── ProgramFeeStructure (1:1 with Program) ────────────────────
//
// Three Json columns with strict shape validation. The admin form's
// JSON textareas pipe through JSON.parse → these schemas → Prisma.
// If admin pastes malformed JSON, action returns the Zod error path.
//
const overviewStatSchema = z.object({
  iconName: z.string().min(1),
  label:    z.string().min(1),
  value:    z.string().min(1),
});

const feeTierSchema = z.object({
  gpa:          z.string().min(1),
  waiver:       z.string().optional(),
  totalCredits: z.number().optional(),
  perCredit:    z.number(),
  total:        z.number(),
});

const feeGroupSchema = z.object({
  background: z.string().min(1),
  tiers:      z.array(feeTierSchema).default([]),
});

const feeShiftSchema = z.object({
  iconName:    z.string().min(1),
  name:        z.string().min(1),
  shiftLabel:  z.string().min(1),
  description: z.string().min(1),
  groups:      z.array(feeGroupSchema).default([]),
});

const feePolicySchema = z.object({
  iconName: z.string().min(1),
  title:    z.string().min(1),
  text:     z.string().min(1),
});

export const programFeeStructureCreateSchema = z.object({
  programId:     z.string().min(1),
  introOverline: z.string().min(1).max(300),
  introHeading:  z.string().min(1).max(300),
  introBody:     z.string().min(1),
  overviewStats: z.array(overviewStatSchema).default([]),
  shifts:        z.array(feeShiftSchema).default([]),
  policies:      z.array(feePolicySchema).default([]),
});

export const programFeeStructureUpdateSchema = programFeeStructureCreateSchema;

// ─────────────────────────────────────────────────────────────────
//  Phase 8c — Admission CMS Part 3 (Transfer Credits + Waiver/Scholarship)
// ─────────────────────────────────────────────────────────────────

// ─── AdmissionTransferCredits (singleton) ─────────────────────
const headingBodySchema = z.object({
  heading: z.string().min(1).max(300),
  body:    z.string().min(1),
});

const titleDescriptionSchema = z.object({
  title:       z.string().min(1).max(300),
  description: z.string().min(1),
});

const transferSummaryRowSchema = z.object({
  label: z.string().min(1).max(200),
  value: z.string().min(1).max(300),
});

export const admissionTransferCreditsUpdateSchema = z.object({
  intro:               z.string().min(1),
  minimumGradeBullets: z.array(headingBodySchema).default([]),
  limitMaxLabel:       z.string().min(1).max(200),
  limitMaxValue:       z.string().min(1).max(100),
  limitMaxSubtitle:    z.string().min(1).max(300),
  limitFeeLabel:       z.string().min(1).max(200),
  limitFeeValue:       z.string().min(1).max(100),
  limitFeeSubtitle:    z.string().min(1).max(300),
  documentsIntroText:  z.string().min(1),
  documents:           z.array(titleDescriptionSchema).default([]),
  summaryKicker:       z.string().min(1).max(200),
  summaryHeading:      z.string().min(1).max(300),
  summaryRows:         z.array(transferSummaryRowSchema).default([]),
});

// ─── WaiverScholarshipLanding (singleton) ─────────────────────
// status is a fixed enum: Active = row is visible on the public
// summary table; Inactive = row is hidden (admin keeps it on
// record without showing it). Renderer (CP8c.3) filters inactive.
export const waiverSummaryStatusEnum = z.enum(['Active', 'Inactive']);

const waiverSummaryRowSchema = z.object({
  category: z.string().min(1).max(300),
  max:      z.string().min(1).max(200),
  status:   waiverSummaryStatusEnum,
});

export const waiverScholarshipLandingUpdateSchema = z.object({
  intro:              z.string().min(1),
  part1Kicker:        z.string().min(1).max(100),
  part1Heading:       z.string().min(1).max(300),
  summaryHeading:     z.string().min(1).max(300),
  summarySubheading:  z.string().min(1).max(500),
  summaryRows:        z.array(waiverSummaryRowSchema).default([]),
  summaryFooterNote:  z.string().min(1),
  part2Kicker:        z.string().min(1).max(100),
  part2Heading:       z.string().min(1).max(300),
  part2Intro:         z.string().min(1),
  keyTakeawaysKicker: z.string().min(1).max(200),
  keyTakeaways:       paragraphsArraySchema,
});

// ─── WaiverCategory (multi-row) ───────────────────────────────
const headingTextSchema = z.object({
  heading: z.string().min(1).max(300),
  text:    z.string().min(1),
});

export const waiverCategoryCreateSchema = z.object({
  slug:     z.string().min(1).max(160).regex(slugRegexHub, 'Slug must be lowercase letters, numbers, and hyphens only'),
  iconName: z.string().min(1).max(80),
  title:    z.string().min(1).max(300),
  items:    z.array(headingTextSchema).default([]),
  note:     optionalNullableString,
});

export const waiverCategoryUpdateSchema = waiverCategoryCreateSchema;

// ─── Scholarship (multi-row) ──────────────────────────────────
export const scholarshipCreateSchema = z.object({
  slug:        z.string().min(1).max(160).regex(slugRegexHub, 'Slug must be lowercase letters, numbers, and hyphens only'),
  name:        z.string().min(1).max(200),
  credits:     z.string().min(1).max(200),
  base:        z.string().min(1).max(100),
  perfect:     z.string().min(1).max(100),
  near:        z.string().min(1).max(100),
  isHighlight: z.boolean().default(false),
});

export const scholarshipUpdateSchema = scholarshipCreateSchema;

// ─────────────────────────────────────────────────────────────────
//  Phase 9 — ContactSubmission (public submit + admin status update)
//    Public schema mirrors the ContactForm fields. Honeypot is read
//    + rejected in the route handler before this schema runs, so
//    no honeypot field appears here.
// ─────────────────────────────────────────────────────────────────

export const contactStatusEnum = z.enum(['new', 'read', 'archived']);

const emptyToNullString = (max: number) =>
  z.string().max(max).optional().or(z.literal(''))
    .transform((v) => (v && v.trim().length > 0 ? v.trim() : null));

export const contactSubmissionCreateSchema = z.object({
  name:    z.string().trim().min(1).max(200),
  email:   z.string().trim().email().max(320),
  phone:   emptyToNullString(50),
  subject: emptyToNullString(300),
  message: z.string().trim().min(1).max(10000),
});

export const contactSubmissionStatusUpdateSchema = z.object({
  status: contactStatusEnum,
});

// ─────────────────────────────────────────────────────────────────
//  Newsletter — page CMS + public subscribe + admin subscriber actions
// ─────────────────────────────────────────────────────────────────

// Each advantage row in the NewsletterPage.advantages Json array.
// Mirrors the AboutDepartmentClub.activities shape (Json structured editor)
// — iconName resolves through DynamicLucideIcon at render time.
const newsletterAdvantagesArraySchema = z.array(
  z.object({
    iconName:    z.string().min(1),
    title:       z.string().min(1),
    description: z.string().min(1),
  }),
);

export const newsletterPageUpdateSchema = z.object({
  heroTitle:                z.string().min(1).max(300),
  heroSubtitle:             optionalNullableString,
  heroOverline:             optionalNullableString,
  heroImageUrl:             z.string().min(1),
  heroImagePublicId:        optionalNullableString,
  heroImageVerticalPercent: z.coerce.number().int().min(0).max(100).default(50),
  introBody:                z.string().min(1),
  advantagesOverline:       optionalNullableString,
  advantagesHeading:        z.string().min(1).max(300),
  advantages:               newsletterAdvantagesArraySchema,
  ctaHeading:               z.string().min(1).max(300),
  ctaBody:                  optionalNullableString,
  ctaButtonLabel:           z.string().min(1).max(80),
  emailPlaceholder:         z.string().min(1).max(120),
  privacyNote:              optionalNullableString,
});

// Public form input — narrow to just the email, with conservative
// length cap mirroring ContactSubmission email validation.
export const newsletterSubscribeSchema = z.object({
  email: z.string().trim().email().max(320),
});

// ─────────────────────────────────────────────────────────────────
//  SUEEC join application — public submit + admin status edit
// ─────────────────────────────────────────────────────────────────

const clubSemesterEnum = z.enum(['1', '2', '3', '4', '5', '6', '7', '8']);

export const departmentClubApplicationCreateSchema = z.object({
  fullName:   z.string().trim().min(1).max(200),
  studentId:  z.string().trim().min(1).max(50),
  email:      z.string().trim().email().max(320),
  phone:      z.string().trim().min(1).max(50),
  semester:   clubSemesterEnum,
  motivation: z.string().trim().min(1).max(2000),
});

export const departmentClubApplicationStatusEnum = z.enum([
  'pending',
  'approved',
  'rejected',
]);

export const departmentClubApplicationStatusUpdateSchema = z.object({
  status: departmentClubApplicationStatusEnum,
});

// Generic page-hero update. pageKey + publicPath + pageLabel are
// stable identifiers seeded by migration — they are NOT in the
// editable surface, so the admin form passes only the hero fields.
export const pageHeroUpdateSchema = z.object({
  heroTitle:                z.string().min(1).max(300),
  heroSubtitle:             optionalNullableString,
  heroOverline:             optionalNullableString,
  heroImageUrl:             z.string().min(1),
  heroImagePublicId:        optionalNullableString,
  heroImageVerticalPercent: z.coerce.number().int().min(0).max(100).default(50),
});

// ─────────────────────────────────────────────────────────────────
//  Phase 10 — ContactPageContent singleton + CampusLocation multi-row
//    Final hardcoded-content close-out from the /contact page.
// ─────────────────────────────────────────────────────────────────

const quickContactCardSchema = z.object({
  iconName:       z.string().min(1).max(80),
  title:          z.string().min(1).max(120),
  primaryValue:   z.string().min(1).max(300),
  primaryHref:    z.string().max(500).optional().or(z.literal('')).transform((v) => (v && v.length > 0 ? v : null)),
  secondaryValue: z.string().max(300).optional().or(z.literal('')).transform((v) => (v && v.length > 0 ? v : null)),
  secondaryHref:  z.string().max(500).optional().or(z.literal('')).transform((v) => (v && v.length > 0 ? v : null)),
  hint:           z.string().max(200).optional().or(z.literal('')).transform((v) => (v && v.length > 0 ? v : null)),
});

export const contactPageContentUpdateSchema = z.object({
  heroTitle:           z.string().min(1).max(200),
  heroOverline:        optionalNullableString,
  heroImageUrl:        z.string().min(1),
  heroImagePublicId:   nullableString,
  heroImageVerticalPercent: z.coerce.number().int().min(0).max(100).default(50),
  introBody:           z.string().min(1),
  quickContactHeading: z.string().min(1).max(200),
  formHeading:         z.string().min(1).max(200),
  formSubheading:      z.string().min(1),
  campusesHeading:     z.string().min(1).max(200),
  responseTimeNote:    z.string().min(1).max(500),
  quickContactCards:   z.array(quickContactCardSchema).default([]),
});

export const campusLocationCreateSchema = z.object({
  slug:    z.string().min(1).max(160).regex(slugRegex, 'Slug must be lowercase letters, numbers, and hyphens only'),
  name:    z.string().min(1).max(200),
  tag:     optionalNullableString,
  address: z.string().min(1),
  phone:   optionalNullableString,
  email:   z.string().email().max(320),
  mapsUrl: optionalNullableString,
});

export const campusLocationUpdateSchema = campusLocationCreateSchema;

// ─────────────────────────────────────────────────────────────────
//  Phase 12 — JourneyCTAContent singleton (chrome section between
//    page content and the footer; previously hardcoded).
// ─────────────────────────────────────────────────────────────────

export const journeyCTAContentUpdateSchema = z.object({
  heroImageUrl:         z.string().min(1),
  heroImagePublicId:    nullableString,
  heroImageVerticalPercent: z.coerce.number().int().min(0).max(100).default(50),
  heading:              z.string().min(1).max(300),
  body:                 z.string().min(1),
  primaryCtaLabel:      z.string().min(1).max(100),
  primaryCtaHref:       z.string().min(1).max(500),
  primaryCtaExternal:   z.boolean().optional().default(false),
  secondaryCtaLabel:    z.string().min(1).max(100),
  secondaryCtaHref:     z.string().min(1).max(500),
  secondaryCtaExternal: z.boolean().optional().default(false),
});
