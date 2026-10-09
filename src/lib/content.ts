import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import sharp from 'sharp';

import type { OlderWorksSleeve, Project } from '../data/content-types';

const CONTENT_ROOT = path.join(process.cwd(), 'content');
const PROJECTS_ROOT = path.join(CONTENT_ROOT, 'projects');
const PUBLIC_ROOT = path.join(process.cwd(), 'public');
const FALLBACK_COLORS: CoverColors = { placeholder: '#121313', coverColor: '#121313' };

interface CoverColors {
  placeholder: string;
  coverColor: string;
}

function contentFiles(root: string): string[] {
  return fs.readdirSync(root)
    .filter((filename) => filename.endsWith('.mdx'))
    .sort();
}

function readDocument(root: string, filename: string) {
  const source = fs.readFileSync(path.join(root, filename), 'utf8');
  return matter(source);
}

const coverColorCache = new Map<string, Promise<CoverColors>>();

/**
 * From a 3×3 downsample: corner colours blended as soft radial gradients over the centre colour
 * (`placeholder`), plus the average of all nine samples (`coverColor`).
 */
function coverColors(coverUrl: string): Promise<CoverColors> {
  const cached = coverColorCache.get(coverUrl);
  if (cached) return cached;
  const computed = coverUrl.startsWith('/')
    ? sharp(path.join(PUBLIC_ROOT, coverUrl.slice(1)))
      .resize(3, 3, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer()
      .then((pixels) => {
        const color = (x: number, y: number) => {
          const offset = (y * 3 + x) * 3;
          return `rgb(${pixels[offset]} ${pixels[offset + 1]} ${pixels[offset + 2]})`;
        };
        const average = [0, 1, 2].map((channel) => {
          let sum = 0;
          for (let sample = 0; sample < 9; sample += 1) sum += pixels[sample * 3 + channel];
          return Math.round(sum / 9).toString(16).padStart(2, '0');
        });
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
      })
      .catch(() => FALLBACK_COLORS)
    : Promise.resolve(FALLBACK_COLORS);
  coverColorCache.set(coverUrl, computed);
  return computed;
}

async function readProject(filename: string, includeContent: boolean): Promise<Project> {
  const document = readDocument(PROJECTS_ROOT, filename);
  const data = document.data as Omit<Project, 'content' | keyof CoverColors>;
  return {
    ...data,
    ...await coverColors(data.coverUrl),
    content: includeContent ? document.content.trim() : undefined,
  };
}

export async function getProjects(): Promise<Project[]> {
  const projects = await Promise.all(contentFiles(PROJECTS_ROOT).map((filename) => readProject(filename, false)));
  return projects.sort((left, right) => right.catalog - left.catalog);
}

export async function getProject(slug: string): Promise<Project | undefined> {
  const filename = `${slug}.mdx`;
  if (!fs.existsSync(path.join(PROJECTS_ROOT, filename))) return undefined;
  return readProject(filename, true);
}

/** Written by `npm run sync:vault` from the vault's sdj-cover-older-works[-back] attachments. */
const OLDER_WORKS_MANIFEST = path.join(CONTENT_ROOT, 'older-works.json');

/** The crate's back-catalogue sleeve: image URLs plus the front's average colour for the loading state. */
export async function getOlderWorksSleeve(): Promise<OlderWorksSleeve> {
  const { coverUrl, backCoverUrl } = JSON.parse(fs.readFileSync(OLDER_WORKS_MANIFEST, 'utf8')) as Omit<OlderWorksSleeve, 'coverColor'>;
  const { coverColor } = await coverColors(coverUrl);
  return { coverUrl, coverColor, backCoverUrl };
}
