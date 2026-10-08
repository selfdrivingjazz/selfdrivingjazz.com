/**
 * URL of `src` resized and re-encoded (AVIF/WebP) by Next's image optimizer, for images loaded
 * outside `next/image` (WebGL textures, canvas collages). `width` must be one of the configured
 * `deviceSizes`/`imageSizes` (defaults include 384, 640, 828, 1080).
 */
export function optimizedImageUrl(src: string, width: number): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
}
