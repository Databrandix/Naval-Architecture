import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth-server';
import GalleryImageForm from '../GalleryImageForm';

export const metadata = { title: 'New gallery image' };

export default async function NewGalleryImagePage() {
  const session = await getSession();
  if (!session?.user) redirect('/admin/login');

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl font-display font-bold text-gray-900">Add gallery image</h1>
        <p className="mt-1 text-sm text-gray-500">
          New image for <code className="font-mono">/gallery</code>.
        </p>
      </header>
      <GalleryImageForm initial={null} />
    </div>
  );
}
