/**
 * Colours derived from a cover image at sync time, so the site never decodes artwork to style a page.
 *
 *   ambience     three hex colours that represent the artwork: [dominant, strongest accent, next accent]
 *   placeholder  CSS background approximating the cover (corner gradients over the centre colour)
 *   coverColor   average cover colour (hex), for surfaces that can't use a gradient
 *
 * Everything is computed from one nearest-neighbour sample grid of the same square crop the published cover
 * uses. Nearest-neighbour keeps real pixel colours: averaging would blend halftone dots and fine linework into
 * the background and produce muddy in-between colours the artwork never contains.
 */
import sharp from 'sharp';

/** Sample grid edge, divisible by 3 for the placeholder's 3×3 cells. */
const SAMPLE = 120;
/** Histogram bin size in OKLab (lightness, then a/b). */
const BIN_L = 0.04;
const BIN_AB = 0.02;
/** Bins closer than this (OKLab distance) merge into one colour cluster. */
const MERGE_DISTANCE = 0.07;
/** Clusters covering less of the cover than this are speckle, not palette. */
const MIN_SHARE = 0.004;
/** A pick this close to an already chosen colour reads as the same colour, so it's skipped while others remain. */
const DISTINCT_DISTANCE = 0.12;
/**
 * A pick this close to the line between two chosen colours is a shade or mix of them (anti-aliased edges,
 * halftone dots averaged into their background), so it's skipped while others remain. Smaller than
 * DISTINCT_DISTANCE: a real accent that happens to sit near that line, like gold between brown and cream, stays.
 */
const BLEND_DISTANCE = 0.06;
/** How much chroma lifts a cluster's claim to an accent slot; zero-chroma clusters compete on area alone. */
const CHROMA_WEIGHT = 8;

export interface CoverColors {
  ambience: readonly [string, string, string];
  placeholder: string;
  coverColor: string;
}

type Lab = readonly [number, number, number];

interface Cluster {
  lab: [number, number, number];
  count: number;
}

const toLinear = (channel: number) => {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const toSrgb = (linear: number) => {
  const value = Math.min(1, Math.max(0, linear));
  const encoded = value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;
  return Math.round(encoded * 255);
};

/** sRGB (0–255) → OKLab. */
function oklab(red: number, green: number, blue: number): Lab {
  const r = toLinear(red);
  const g = toLinear(green);
  const b = toLinear(blue);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** OKLab → `#rrggbb`. */
function hex([lightness, a, b]: Lab): string {
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const channels = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return `#${channels.map((channel) => toSrgb(channel).toString(16).padStart(2, '0')).join('')}`;
}

const distance = (left: Lab, right: Lab) => Math.hypot(left[0] - right[0], left[1] - right[1], left[2] - right[2]);

/**
 * Colour clusters by area: pixels are binned in OKLab, then bins (largest first) merge into the nearest
 * cluster within MERGE_DISTANCE. Bins are visited in a fixed order, so the result is deterministic.
 */
function clusters(pixels: Buffer): Cluster[] {
  const bins = new Map<string, { sum: [number, number, number]; count: number }>();
  for (let offset = 0; offset < pixels.length; offset += 3) {
    const lab = oklab(pixels[offset], pixels[offset + 1], pixels[offset + 2]);
    const key = `${Math.round(lab[0] / BIN_L)},${Math.round(lab[1] / BIN_AB)},${Math.round(lab[2] / BIN_AB)}`;
    const bin = bins.get(key) ?? { sum: [0, 0, 0], count: 0 };
    bin.sum[0] += lab[0];
    bin.sum[1] += lab[1];
    bin.sum[2] += lab[2];
    bin.count += 1;
    bins.set(key, bin);
  }

  const ordered = [...bins.entries()].sort(([leftKey, left], [rightKey, right]) =>
    right.count - left.count || (leftKey < rightKey ? -1 : 1));
  const merged: Cluster[] = [];
  for (const [, bin] of ordered) {
    const lab: Lab = [bin.sum[0] / bin.count, bin.sum[1] / bin.count, bin.sum[2] / bin.count];
    let nearest: Cluster | undefined;
    for (const cluster of merged) {
      if (distance(cluster.lab, lab) < MERGE_DISTANCE && (!nearest || distance(cluster.lab, lab) < distance(nearest.lab, lab))) {
        nearest = cluster;
      }
    }
    if (!nearest) {
      merged.push({ lab: [...lab], count: bin.count });
      continue;
    }
    const total = nearest.count + bin.count;
    for (let channel = 0; channel < 3; channel += 1) {
      nearest.lab[channel] = (nearest.lab[channel] * nearest.count + lab[channel] * bin.count) / total;
    }
    nearest.count = total;
  }
  return merged.sort((left, right) => right.count - left.count);
}

/** Distance from `lab` to the nearest point on the line segment between `from` and `to`. */
function segmentDistance(lab: Lab, from: Lab, to: Lab): number {
  const span = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
  const along = ((lab[0] - from[0]) * span[0] + (lab[1] - from[1]) * span[1] + (lab[2] - from[2]) * span[2])
    / (span[0] ** 2 + span[1] ** 2 + span[2] ** 2);
  const t = Math.min(1, Math.max(0, along));
  return distance(lab, [from[0] + t * span[0], from[1] + t * span[1], from[2] + t * span[2]]);
}

/**
 * The dominant cluster, then the two strongest distinct accents. An accent's claim grows with area (damped, so
 * a small vivid accent can beat a large dull field) and with chroma, so real colour accents win over muddy
 * in-betweens; grey covers have no chroma to reward and keep their greys. While any remain, picks must be
 * distinct colours (DISTINCT_DISTANCE) and not shades or mixes of two chosen ones (BLEND_DISTANCE). A cover
 * without enough of those (monochrome, duotone) takes the remaining cluster furthest from what is chosen, so its
 * real tonal range shows instead of a near-duplicate; one with fewer than three clusters repeats its own.
 */
function ambience(found: Cluster[], total: number): readonly [string, string, string] {
  const candidates = found.filter((cluster) => cluster.count / total >= MIN_SHARE);
  const chosen: Cluster[] = [candidates[0] ?? found[0]];
  const score = (cluster: Cluster) => Math.sqrt(cluster.count / total) * (1 + CHROMA_WEIGHT * Math.hypot(cluster.lab[1], cluster.lab[2]));
  const nearestChosen = (cluster: Cluster) => Math.min(...chosen.map((pick) => distance(pick.lab, cluster.lab)));
  while (chosen.length < 3) {
    const remaining = candidates.filter((cluster) => !chosen.includes(cluster));
    const distinct = remaining.filter((cluster) => nearestChosen(cluster) >= DISTINCT_DISTANCE
      && chosen.every((from, index) => chosen.slice(index + 1).every((to) => segmentDistance(cluster.lab, from.lab, to.lab) >= BLEND_DISTANCE)));
    const next = distinct.length > 0
      ? distinct.reduce((best, cluster) => (score(cluster) > score(best) ? cluster : best))
      : remaining.reduce<Cluster | undefined>((best, cluster) => (!best || nearestChosen(cluster) > nearestChosen(best) ? cluster : best), undefined);
    chosen.push(next ?? chosen[chosen.length - 1]);
  }
  return [hex(chosen[0].lab), hex(chosen[1].lab), hex(chosen[2].lab)];
}

/** Placeholder gradient and average colour from the sample grid's 3×3 cell means (sRGB, like a box downsample). */
function placeholderColors(pixels: Buffer): Pick<CoverColors, 'placeholder' | 'coverColor'> {
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
  return {
    ambience: ambience(clusters(pixels), SAMPLE * SAMPLE),
    ...placeholderColors(pixels),
  };
}
