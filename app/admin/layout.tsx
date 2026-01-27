import type { Metadata, Viewport } from 'next';
import PinProtection from '@/components/PinProtection';

export const metadata: Metadata = {
  title: 'Barber Elite - Admin Dashboard',
  description: 'Admin dashboard for Barber Elite queue management',
  generator: 'Next.js',
  manifest: '/manifest-admin.json',
  keywords: ['barber', 'admin', 'queue management', 'dashboard'],
  authors: [
    { name: 'Barber Elite' }
  ],
  icons: [
    { rel: 'apple-touch-icon', url: '/admin-icons/apple-touch-icon.png' },
    { rel: 'icon', url: '/admin-icons/icon-192x192.png' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Barber Admin',
  },
  formatDetection: {
    telephone: false,
  },
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#334155',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PinProtection>{children}</PinProtection>;
}