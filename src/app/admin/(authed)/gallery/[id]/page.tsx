import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth-server';
import GalleryImageForm from '../GalleryImageForm';

type Params = { id: string };

export const metadata = { title: 'Edit gallery image' };

export default async function EditGalleryImagePage({ params }: { params: Promise<Params> }) {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  const { id } = await params;
  const image = await prisma.galleryImage.findUnique({ where: { id } });
  if (!image) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Edit gallery image</h1>
        <p className="mt-1 text-sm text-gray-500">
          Order: <span className="font-mono">{image.displayOrder}</span> · <span className="font-mono">{image.width} × {image.height}</span>
        </p>
      </header>
      <GalleryImageForm initial={image} />
    </div>
  );
}
