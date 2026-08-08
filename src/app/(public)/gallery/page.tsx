import PageShell from '@/components/layout/PageShell';
import Container from '@/components/ui/Container';
import GalleryGrid from '@/components/gallery/GalleryGrid';
import { getGalleryImages, getPageHero } from '@/lib/identity';
import { departmentMetadata } from '@/lib/page-metadata';

export async function generateMetadata() {
  return departmentMetadata({
    title: 'Gallery',
    description:
      'Campus life moments from the Department of Mechanical Engineering, Sonargaon University.',
  });
}

export default async function GalleryPage() {
  const [images, hero] = await Promise.all([
    getGalleryImages(),
    getPageHero('gallery'),
  ]);

  return (
    <PageShell
      title={hero?.heroTitle ?? 'Photo Gallery'}
      subtitle={hero?.heroSubtitle ?? undefined}
      overline={hero?.heroOverline ?? 'Campus Life'}
      image={hero?.heroImageUrl ?? '/assets/mission-vision-hero.webp'}
      imagePosition={hero ? `center ${hero.heroImageVerticalPercent}%` : 'center 3%'}
      contentClassName="bg-gray-50 py-12 md:py-16"
    >
      <Container>
        <GalleryGrid
          images={images.map((g) => ({
            id:       g.id,
            imageUrl: g.imageUrl,
            alt:      g.alt,
            width:    g.width,
            height:   g.height,
          }))}
        />
      </Container>
    </PageShell>
  );
}
