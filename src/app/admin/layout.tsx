import type { Metadata } from 'next';
import ToasterClient from '@/components/admin/ToasterClient';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s — Department Admin' },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ToasterClient />
    </>
  );
}
