'use client';

import Image from 'next/image';
import {motion} from 'motion/react';
import Container from '../ui/Container';

export default function OverviewSection() {
  return (
    <section className="bg-white py-8 md:py-16">
      <Container className="!max-w-[1120px]">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 md:mb-8 text-center text-2xl font-bold leading-tight text-primary md:text-[25px]"
        >
          Department of Electrical and Electronics Engineering (EEE)
        </motion.h2>

        <div className="mx-auto grid max-w-[1090px] items-start gap-8 lg:gap-12 lg:grid-cols-[520px_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1 space-y-6"
          >
            <p className="text-justify text-[16px] font-medium leading-[1.75] tracking-[0.035em] text-black">
              At the heart of innovation and excellence, the Department of Electrical and Electronics Engineering is committed to shaping future leaders in the field. Explore the dynamic world of electrical and electronics engineering, where creativity meets technology, and where ideas transform into groundbreaking solutions. With a focus on interdisciplinary collaboration and real-world applications, our department prepares students to tackle complex challenges and contribute to the advancement of technology and society.
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
              src="/assets/homeimg.webp"
              alt="Sonargaon University Electrical and Electronics Engineering students engaged in laboratory work"
              width={1600}
              height={900}
              sizes="(min-width: 1024px) 540px, 100vw"
              className="h-auto w-full object-cover lg:h-[294px]"
            />
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
