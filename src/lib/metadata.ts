import type { Metadata } from 'next';

interface PageMetadataOptions {
  path?: string;
  description?: string;
  projectSlug?: string;
  socialTitle?: string;
  imageAlt?: string;
}

export const SITE_NAME = 'self-driving jazz';
export const SITE_URL = 'https://selfdrivingjazz.com';
export const DEFAULT_DESCRIPTION = 'experiments in recursive media.';

export function socialImage(projectSlug?: string): string {
  return projectSlug ? `/api/og?project=${encodeURIComponent(projectSlug)}` : '/api/og';
}

export function pageMetadata({
  path = '/',
  description = DEFAULT_DESCRIPTION,
  projectSlug,
  socialTitle = SITE_NAME,
  imageAlt = projectSlug ? `${SITE_NAME} project preview` : `${SITE_NAME} preview`,
}: PageMetadataOptions = {}): Metadata {
  const image = socialImage(projectSlug);
  return {
    title: SITE_NAME,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: socialTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: 'en_US',
      type: 'website',
      images: [{
        url: image,
        width: 1200,
        height: 630,
        alt: imageAlt,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [image],
    },
  };
}
