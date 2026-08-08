import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import AboutMissionVisionForm from './AboutMissionVisionForm';

export const metadata = { title: 'About — Mission & Vision' };

export default async function AboutMissionVisionPage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const row = await prisma.aboutMissionVision.findUnique({ where: { id: 'singleton' } });

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">About — Mission &amp; Vision</h1>
        <p className="mt-1 text-sm text-gray-500">
          Hero + Mission card + Vision card for <code className="font-mono">/about/mission-vision</code>.
        </p>
      </header>
      <AboutMissionVisionForm initial={row} />
    </div>
  );
}
