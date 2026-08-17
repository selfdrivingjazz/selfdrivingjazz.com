import { Recursive, Syne } from 'next/font/google';
import '../styles.css';
import JsonLd from '../components/JsonLd.jsx';
import {
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  pageMetadata,
} from '../lib/metadata.js';

const recursive = Recursive({
  subsets: ['latin'],
  weight: 'variable',
  axes: ['CASL', 'MONO'],
  variable: '--font-recursive',
  display: 'swap',
});
const syne = Syne({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-syne',
  display: 'swap',
});

export const dynamic = 'force-dynamic';

export const metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: 'arts and media',
  keywords: ['self-driving jazz', 'recursive media', 'autonomous media', 'creative technology'],
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  ...pageMetadata(),
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#080808',
  colorScheme: 'dark',
};

const organizationData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      inLanguage: 'en-US',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
      sameAs: [
        'https://github.com/selfdrivingjazz',
        'https://x.com/selfdrivingjazz',
        'https://selfdrivingjazz.substack.com',
      ],
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${recursive.variable} ${syne.variable}`}>
      <body>
        <JsonLd data={organizationData} />
        {children}
      </body>
    </html>
  );
}
