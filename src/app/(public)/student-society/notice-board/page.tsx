import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import { getNotices, getPageHero } from '@/lib/identity';
import NoticesClient from './NoticesClient';

export const metadata = {
  title: 'Notice Board — Department of Electrical and Electronics Engineering',
  description:
    'Departmental notices and announcements — registration, holidays, transport, and student services.',
};

export default async function NoticeBoardPage() {
  const [notices, hero] = await Promise.all([
    getNotices(),
    getPageHero('student-society-notice-board'),
  ]);

  return (
    <PageShell
      title={hero?.heroTitle ?? 'Notice Board'}
      subtitle={hero?.heroSubtitle ?? undefined}
      overline={hero?.heroOverline ?? 'Student'}
      image={hero?.heroImageUrl ?? '/assets/notice-board-hero.webp'}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : undefined}
      contentClassName="bg-gray-50 py-12 md:py-20"
    >
      <Container>
        {notices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">No notices yet.</p>
          </div>
        ) : (
          <NoticesClient
            notices={notices.map((n) => ({
              slug:        n.slug,
              title:       n.title,
              category:    n.category,
              department:  n.department,
              publishedAt: n.publishedAt.toISOString(),
              displayDate: n.displayDate,
              description: n.description,
              fileUrl:     n.fileUrl,
              fileType:    n.fileType,
              fileName:    n.fileName,
            }))}
          />
        )}
      </Container>
    </PageShell>
  );
}
