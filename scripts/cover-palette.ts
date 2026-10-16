/**
 * Colours derived from a cover image at sync time, so the site never decodes artwork to style a page.
 *
 *   placeholder  CSS background approximating the cover (corner gradients over the centre colour), shown
 *                until the artwork (or its blurred backdrop) loads
 *   coverColor   average cover colour (hex), for surfaces that can't use a gradient
 *
 * Both come from one nearest-neighbour sample grid of the same square crop the published cover uses.
 */
import sharp from 'sharp';

/** Sample grid edge, divisible by 3 for the placeholder's 3×3 cells. */
const SAMPLE = 120;

export interface CoverColors {
  placeholder: string;
  coverColor: string;
}

/** Placeholder gradient and average colour from the sample grid's 3×3 cell means (sRGB, like a box downsample). */
function placeholderColors(pixels: Buffer): CoverColors {
  const cell = SAMPLE / 3;
  const cells: number[][] = [];
  for (let cellY = 0; cellY < 3; cellY += 1) {
    for (let cellX = 0; cellX < 3; cellX += 1) {
      const sum = [0, 0, 0];
      for (let y = cellY * cell; y < (cellY + 1) * cell; y += 1) {
        for (let x = cellX * cell; x < (cellX + 1) * cell; x += 1) {
          const offset = (y * SAMPLE + x) * 3;
          for (let channel = 0; channel < 3; channel += 1) sum[channel] += pixels[offset + channel];
        }
      }
      cells.push(sum.map((value) => Math.round(value / (cell * cell))));
    }
  }
  const color = (x: number, y: number) => `rgb(${cells[y * 3 + x].join(' ')})`;
  const average = [0, 1, 2].map((channel) =>
    Math.round(cells.reduce((sum, rgb) => sum + rgb[channel], 0) / cells.length).toString(16).padStart(2, '0'));
  return {
    placeholder: [
      `radial-gradient(at 0% 0%, ${color(0, 0)}, transparent 70%)`,
      `radial-gradient(at 100% 0%, ${color(2, 0)}, transparent 70%)`,
      `radial-gradient(at 0% 100%, ${color(0, 2)}, transparent 70%)`,
      `radial-gradient(at 100% 100%, ${color(2, 2)}, transparent 70%)`,
      color(1, 1),
    ].join(', '),
    coverColor: `#${average.join('')}`,
  };
}

/** Colours of `source` as published: the centred square crop, alpha flattened onto black. */
export async function coverColors(source: string): Promise<CoverColors> {
  const pixels = await sharp(source)
    .resize(SAMPLE, SAMPLE, { fit: 'cover', kernel: 'nearest', fastShrinkOnLoad: false })
    .flatten({ background: '#000000' })
    .toColourspace('srgb')
    .raw()
    .toBuffer();
  return placeholderColors(pixels);
}
