'use client';

import Image from 'next/image';
import {motion} from 'motion/react';
import Container from '../ui/Container';

/**
 * The heading and paragraph used to be written into this file, which meant the
 * homepage introduced whichever department the code was last copied from and
 * no admin could correct it. Both now come from the About Overview row, so the
 * homepage and /about/overview say the same thing and are edited in one place.
 */
export default function OverviewSection({
  heading,
  body,
  imageUrl,
  imageAlt,
}: {
  heading: string;
  body: string;
  imageUrl: string;
  imageAlt: string;
}) {
  return (
    <section className="bg-white py-8 md:py-16">
      <Container className="!max-w-[1120px]">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 md:mb-8 text-center text-2xl font-bold leading-tight text-primary md:text-[25px]"
        >
          {heading}
        </motion.h2>

        {/* The text column is narrower than the picture's, so the picture gets
            the larger share — the paragraph reads better short of full width
            anyway, and the photograph was leaving white space beneath it. */}
        <div className="mx-auto grid max-w-[1090px] items-start gap-8 lg:gap-12 lg:grid-cols-[460px_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1 space-y-6"
          >
            <p className="text-justify text-[16px] font-medium leading-[1.75] tracking-[0.035em] text-black">
              {body}
            </p>

            <div className="grid gap-5 sm:grid-cols-2">
              <a
                href="/about/overview"
                className="rounded-full bg-gradient-to-r from-primary to-accent px-8 py-3 text-center text-base font-semibold text-white shadow-md transition-all hover:shadow-premium"
              >
                Explore More
              </a>
              <a
                href="/about/deans-message"
                className="rounded-full bg-gradient-to-r from-primary to-accent px-8 py-3 text-center text-base font-semibold text-white shadow-md transition-all hover:shadow-premium"
              >
                Dean's Message
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2 overflow-hidden"
          >
            <Image
              src={imageUrl}
              alt={imageAlt}
              width={1600}
              height={900}
              sizes="(min-width: 1024px) 600px, 100vw"
              className="h-auto w-full rounded-lg object-cover lg:h-[380px]"
            />
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
