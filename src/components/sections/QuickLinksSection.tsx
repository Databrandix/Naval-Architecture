'use client';

import {motion} from 'motion/react';
import Container from '../ui/Container';
import {quickLinks} from '../../lib/data';
import {Link as LinkIcon} from 'lucide-react';

export default function QuickLinksSection() {
  return (
    <section id="admission" className="py-8 md:py-16 bg-white overflow-hidden border-b border-gray-100">
      <Container>
        <div className="flex items-center gap-4 mb-6 md:mb-8">
           <LinkIcon className="text-accent" size={24} />
           <h3 className="text-xl font-display font-bold text-primary uppercase tracking-wider">Quick Links</h3>
        </div>

        <div className="flex flex-wrap gap-3 pt-2 pb-1">
          {quickLinks.map((link, idx) => (
            <motion.a
              key={link.name}
              href={link.href}
              {...(link.external && { target: '_blank', rel: 'noopener noreferrer' })}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.04 }}
              whileHover={{ scale: 1.04 }}
              className="px-6 py-2.5 bg-white border border-gray-300 rounded-full text-secondary-dark font-medium whitespace-nowrap transition-colors duration-300 hover:bg-gradient-to-r hover:from-primary hover:to-accent hover:text-white hover:border-transparent hover:shadow-md"
            >
              {link.name}
            </motion.a>
          ))}
        </div>
      </Container>
    </section>
  );
}
