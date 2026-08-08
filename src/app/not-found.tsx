import Link from 'next/link';
import { Home, Search, ArrowLeft, Cog } from 'lucide-react';
import Container from '@/components/ui/Container';
import { departmentMetadata } from '@/lib/page-metadata';

export async function generateMetadata() {
  return departmentMetadata({
    title: 'Page Not Found',
    description:
      "The page you are looking for does not exist on the {department} website.",
  });
}

const quickLinks = [
  { name: 'Department Overview', href: '/about/overview' },
  { name: 'Faculty Members', href: '/faculty-member' },
  { name: 'Admission', href: '/admission/requirements' },
  { name: 'Notice Board', href: '/student-society/notice-board' },
  { name: 'Events', href: '/student-society/events' },
  { name: 'Contact', href: '/contact' },
];

export default function NotFound() {
  return (
    <section className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden pt-[180px] md:pt-[200px] pb-20 bg-gray-50">
      {/* Decorative background blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <Cog
        className="absolute top-[12%] right-[8%] text-primary/[0.04] rotate-12 pointer-events-none hidden md:block"
        size={220}
        strokeWidth={1}
      />
      <Cog
        className="absolute bottom-[10%] left-[6%] text-accent/[0.05] -rotate-12 pointer-events-none hidden md:block"
        size={160}
        strokeWidth={1}
      />

      <Container className="relative z-10">
        <div className="mx-auto max-w-2xl text-center">
          {/* Big 404 with gradient */}
          <h1 className="font-display text-[120px] md:text-[180px] font-extrabold leading-none tracking-tight bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent select-none">
            404
          </h1>

          <div className="mx-auto h-1 w-24 gradient-blue-magenta rounded-full mb-8" />

          <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 ring-1 ring-gray-200 shadow-sm mb-5">
            <Search size={14} className="text-accent" />
            <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-gray-600">
              Page Not Found
            </span>
          </span>

          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-4">
            Looks like this gear is missing.
          </h2>

          <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-10">
            The page you were looking for doesn&apos;t exist or may have moved.
            Try one of the links below, or head back to the homepage.
          </p>

          {/* Primary actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-md shadow-lg transition-all hover:brightness-110 hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Home size={16} />
              Back to Homepage
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3 border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold rounded-md transition-all hover:-translate-y-0.5"
            >
              <ArrowLeft size={16} />
              Contact Us
            </Link>
          </div>

          {/* Helpful links */}
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 md:p-8 text-left">
            <p className="text-[11px] font-bold tracking-[0.25em] uppercase text-gray-500 mb-4 text-center">
              Explore Instead
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="group flex items-center justify-between gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors"
                >
                  <span>{l.name}</span>
                  <span className="text-gray-300 group-hover:text-accent transition-colors">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
