'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { ArrowUpRight, Calendar } from 'lucide-react';
import Container from '../ui/Container';
import SectionTitle from '../ui/SectionTitle';
import Button from '../ui/Button';

type EventRow = {
  slug: string;
  shortTitle: string;
  summary: string;
  imageUrl: string;
  eventDate: Date | string | null;
  displayDate: string | null;
};

type Props = {
  /** Named in the subtitle, so a copy of this site does not advertise another department. */
  departmentShortCode: string;
  events: readonly EventRow[];
};

const EVENTS_PATH = '/student-society/events';

function formatDate(row: EventRow): string | null {
  if (row.displayDate) return row.displayDate;
  if (!row.eventDate) return null;
  const d = new Date(row.eventDate);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function EventsSection({ events, departmentShortCode }: Props) {
  if (events.length === 0) return null;

  return (
    <section className="py-8 md:py-16 bg-white">
      <Container>
        <div className="flex justify-between items-end mb-6 md:mb-8">
          <SectionTitle
            eyebrow="Campus Engagement"
            title="Departmental Events"
            subtitle={`From hands-on workshops to breakthrough announcements—never miss what's shaping tomorrow's innovations at ${departmentShortCode}.`}
          />
          <a href={EVENTS_PATH} className="hidden md:block">
            <Button variant="ghost" className="mb-6 md:mb-8 group">
              View All Events
              <ArrowUpRight
                size={18}
                className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </Button>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {events.map((event, idx) => {
            const dateLabel = formatDate(event);
            return (
              <motion.a
                key={event.slug}
                href={`${EVENTS_PATH}/${event.slug}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10 }}
                className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-premium flex flex-col group"
              >
                <div className="h-52 relative overflow-hidden bg-gray-100">
                  <Image
                    src={event.imageUrl}
                    alt={event.shortTitle}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {dateLabel && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm">
                      <Calendar size={14} className="text-accent" />
                      <span className="text-xs font-bold text-primary">{dateLabel}</span>
                    </div>
                  )}
                </div>
                <div className="p-6 md:p-8 flex flex-col flex-1">
                  <h3 className="text-lg md:text-xl font-display font-bold text-primary mb-3 md:mb-4 leading-tight group-hover:text-accent transition-colors">
                    {event.shortTitle}
                  </h3>
                  <p className="text-secondary-dark/60 text-sm mb-6 md:mb-8 flex-1 leading-relaxed line-clamp-3">
                    {event.summary}
                  </p>
                  <div className="pt-4 border-t border-gray-50 flex justify-between items-center mt-auto">
                    <span className="text-primary font-bold text-sm flex items-center gap-1 group-hover:text-accent transition-colors">
                      View Details
                      <ArrowUpRight
                        size={16}
                        className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </span>
                  </div>
                </div>
              </motion.a>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
