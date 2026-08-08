export interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}

const dimensions: [number, number][] = [
  [732, 960],
  [2048, 1365],
  [960, 720],
  [721, 960],
  [721, 960],
  [2048, 1536],
  [960, 720],
  [1600, 1200],
  [1600, 1200],
  [960, 720],
  [960, 588],
  [720, 960],
  [960, 720],
  [960, 640],
  [960, 720],
  [960, 720],
  [2048, 1536],
  [1600, 1200],
  [2048, 1536],
  [2048, 1536],
  [2048, 1536],
  [2048, 1536],
  [2048, 1536],
  [2048, 1536],
  [2048, 979],
  [2048, 1365],
  [1981, 970],
];

export const galleryImages: GalleryImage[] = dimensions.map(([w, h], i) => {
  const n = String(i + 1).padStart(2, '0');
  return {
    id: `gallery-${n}`,
    src: `/assets/gallery/gallery-${n}.webp`,
    alt: `Campus life at Sonargaon University — moment ${n}`,
    width: w,
    height: h,
  };
});
