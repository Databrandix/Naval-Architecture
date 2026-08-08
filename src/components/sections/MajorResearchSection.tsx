'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import Container from '../ui/Container';
import SectionTitle from '../ui/SectionTitle';
import { DynamicLucideIcon } from '../ui/DynamicLucideIcon';

// Phase 20 — icon resolution for each ResearchArea card:
//   1. iconUrl set        → <Image>  (Cloudinary upload, signed)
//   2. iconName set       → <DynamicLucideIcon> (any of 2,797 Lucide
//                            icons, with HelpCircle fallback inside
//                            DynamicLucideIcon for unknown names)
//
// Phase 0 schema constraint guarantees exactly one of (iconName,
// iconUrl) is provided.

type ResearchAreaRow = {
  id: string;
  iconName: string | null;
  iconUrl: string | null;
  areaName: string;
  description: string | null;
  isFeatured: boolean;
  featuredHeading: string | null;
  featuredImageUrl: string | null;
  featuredDescription: string | null;
  featuredCtaHref: string | null;
};

type MajorResearchSectionProps = {
  areas: readonly ResearchAreaRow[];
};

const DEFAULT_FEATURED_IMAGE = '/assets/research-featured.webp';
const DEFAULT_FEATURED_CTA   = '/research';

function ResearchAreaIcon({ area }: { area: ResearchAreaRow }) {
  if (area.iconUrl) {
    return (
      <Image
        src={area.iconUrl}
        alt=""
        width={24}
        height={24}
        className="object-contain"
      />
    );
  }
  return <DynamicLucideIcon name={area.iconName ?? ''} size={24} />;
}

export default function MajorResearchSection({ areas }: MajorResearchSectionProps) {
  const featured = areas.find((a) => a.isFeatured) ?? null;

  return (
    <section className="py-8 md:py-16 bg-gray-50 border-y border-gray-100">
      <Container>
        <SectionTitle
          eyebrow="Research Focus Areas"
          title="Major Research Area"
          centered
        />

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch">
          {/* Left Grid Area */}
          <div className={`${featured ? 'lg:w-2/3' : 'lg:w-full'} grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6`}>
            {areas.map((area, idx) => (
              <motion.div
                key={area.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -5, backgroundColor: '#ffffff' }}
                className="p-4 md:p-6 rounded-2xl border border-primary/10 shadow-sm flex flex-col justify-center items-center text-center gap-3 md:gap-4 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <ResearchAreaIcon area={area} />
                </div>
                <h4 className="font-display font-semibold text-primary leading-tight text-sm">
                  {area.areaName}
                </h4>
              </motion.div>
            ))}
          </div>

          {/* Right Featured Card — Phase 3: rendered from the
              ResearchArea row flagged isFeatured=true. If no row
              is flagged, the slot collapses and the grid takes
              full width (graceful fallback). */}
          {featured && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:w-1/3 relative rounded-2xl md:rounded-[32px] overflow-hidden group shadow-2xl min-h-[360px] md:min-h-[480px] lg:min-h-0"
            >
              <Image
                src={featured.featuredImageUrl ?? DEFAULT_FEATURED_IMAGE}
                alt={`Featured: ${featured.featuredHeading ?? featured.areaName}`}
                fill
                sizes="(min-width: 1024px) 33vw, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/45 to-primary/10 group-hover:via-primary/65 group-hover:to-primary/20 transition-all duration-500" />
              <div className="absolute bottom-0 left-0 p-6 md:p-8">
                <span className="inline-block px-3 py-1 bg-accent/90 text-white text-[10px] font-bold rounded-full mb-3 uppercase tracking-wider">
                  Featured Insight
                </span>
                <h3 className="text-white text-xl md:text-2xl font-display font-bold mb-3 md:mb-4">
                  {featured.featuredHeading ?? featured.areaName}
                </h3>
                {featured.featuredDescription && (
                  <p className="text-white/70 text-sm mb-4 md:mb-6 leading-relaxed">
                    {featured.featuredDescription}
                  </p>
                )}
                <a
                  href={featured.featuredCtaHref ?? DEFAULT_FEATURED_CTA}
                  className="group flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-accent/90 hover:scale-[1.02]"
                >
                  Read More
                  <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </motion.div>
          )}
        </div>
      </Container>
    </section>
  );
}
