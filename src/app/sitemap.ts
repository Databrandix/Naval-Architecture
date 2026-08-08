import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

const BASE_URL = 'https://eee-engineering-olive.vercel.app';

const staticRoutes: { path: string; priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }[] = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/about/overview', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/about/message-from-head', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/about/deans-message', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/about/mission-vision', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/about/laboratory-facility', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/about/lab-facility', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/about/eee-club', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/about/department-layout', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/admission/requirements', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/admission/tuition-fees', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/admission/transfer-credits', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/admission/waiver-scholarship', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/admission/notice', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/admission/prospectus', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/faculty-member', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/student-society/notice-board', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/student-society/events', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/student-society/alumni', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/student-society/club-list', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/student-society/faq', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/student-society/visitor', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/student-society/syllabus', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/news', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/gallery', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/research', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/transport-service', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/programs/bsc-eee', priority: 0.8, changeFrequency: 'monthly' },
];

// Sitemap is a server function — Phase 7 cuts the stale faculty-data
// / events-data / news-data file reads and pulls slugs directly from
// the DB. Three small queries, each `select`-narrowed to the slug
// column so the payload stays minimal.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const [facultyRows, eventRows, newsRows] = await Promise.all([
    prisma.faculty.findMany({ select: { slug: true } }),
    prisma.event.findMany({ select: { slug: true } }),
    prisma.news.findMany({ select: { slug: true } }),
  ]);

  const statics: MetadataRoute.Sitemap = staticRoutes.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const facultyPages: MetadataRoute.Sitemap = facultyRows.map((m) => ({
    url: `${BASE_URL}/faculty-member/${m.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const eventPages: MetadataRoute.Sitemap = eventRows.map((e) => ({
    url: `${BASE_URL}/student-society/events/${e.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  const newsPages: MetadataRoute.Sitemap = newsRows.map((n) => ({
    url: `${BASE_URL}/news/${n.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.5,
  }));

  return [...statics, ...facultyPages, ...eventPages, ...newsPages];
}
