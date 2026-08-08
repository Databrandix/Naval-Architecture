'use client';

import Image from 'next/image';
import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Home } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Container from '../ui/Container';

const slugToTitle = (slug: string) =>
  slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

interface PageShellProps {
  title: string;
  subtitle?: string;
  /** Small overline tag above the title. Defaults to the parent URL segment, or "Department of". */
  overline?: string;
  children: ReactNode;
  /** Background image for the hero. Defaults to the campus shot. */
  image?: string;
  /** CSS object-position for the hero image. e.g. 'top', 'center 30%'. Default 'center'. */
  imagePosition?: string;
  /** Tailwind classes applied to the content wrapper around children. */
  contentClassName?: string;
}

export default function PageShell({
  title,
  subtitle,
  overline,
  children,
  image = '/assets/site-school-1024x576.webp',
  imagePosition = 'center',
  contentClassName = 'py-12 md:py-16',
}: PageShellProps) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const computedOverline =
    overline ?? (segments.length > 1 ? slugToTitle(segments[0]) : 'Department of');

  return (
    <>
      {/* Hero — matches home HeroSection aesthetic (image + layered overlays + centered content) */}
      <section className="relative min-h-[440px] md:min-h-[500px] w-full overflow-hidden flex flex-col pt-[110px] md:pt-[150px] pb-16">
        {/* Background image with Ken Burns drift */}
        <div className="absolute inset-0 z-0">
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: 1.06 }}
            transition={{ duration: 8, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <Image
              src={image}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition: imagePosition }}
            />
          </motion.div>
          {/* Layered overlays for depth and readability */}
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/10 to-black/30" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,0.5)_100%)]" />
        </div>

        {/* Hero content */}
        <Container className="relative z-10 w-full !max-w-[1600px] flex-1 flex items-center justify-center">
          <div className="flex max-w-4xl flex-col items-center gap-5 md:gap-6 text-center">
            {/* Overline tag */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="flex items-center gap-3"
            >
              <span className="h-px w-8 md:w-10 bg-button-yellow" />
              <span className="text-button-yellow text-[10px] md:text-[11px] font-bold tracking-[0.3em] uppercase">
                {computedOverline}
              </span>
              <span className="h-px w-8 md:w-10 bg-button-yellow" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.8 }}
              className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white uppercase tracking-tight leading-tight drop-shadow-2xl"
            >
              {title}
            </motion.h1>

            {/* Subtitle */}
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.7 }}
                className="text-sm md:text-base lg:text-lg text-white/85 font-light max-w-2xl leading-relaxed"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        </Container>

        {/* Breadcrumb — bottom center */}
        <div className="absolute bottom-6 md:bottom-8 left-0 w-full z-10">
          <Container className="!max-w-[1600px]">
            <motion.nav
              aria-label="Breadcrumb"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="flex items-center justify-center gap-2 text-white/90 text-xs md:text-[13px] font-medium tracking-wide"
            >
              <a
                href="/"
                className="hover:text-button-yellow flex items-center gap-1.5 transition-colors"
              >
                <Home size={13} /> Home
              </a>
              {segments.map((seg, idx) => {
                const href = '/' + segments.slice(0, idx + 1).join('/');
                const isLast = idx === segments.length - 1;
                return (
                  <span key={href} className="inline-flex items-center gap-2">
                    <ChevronRight size={13} className="opacity-50" />
                    {isLast ? (
                      <span className="text-button-yellow font-semibold">
                        {slugToTitle(seg)}
                      </span>
                    ) : (
                      <a href={href} className="hover:text-button-yellow transition-colors">
                        {slugToTitle(seg)}
                      </a>
                    )}
                  </span>
                );
              })}
            </motion.nav>
          </Container>
        </div>
      </section>

      {/* Content area — pages provide their own Container so they control width and padding */}
      <section className={contentClassName}>{children}</section>
    </>
  );
}
