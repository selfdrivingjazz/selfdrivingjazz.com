/**
 * Generates the site's project content from the Obsidian vault.
 *
 *   npm run sync:vault                 # vault at /home/jmill/sdj/nhx4b
 *   SDJ_VAULT=/path/to/vault npm run sync:vault
 *
 * Source: every note in `nobody/publish/project/` with `publish: true`.
 * Output (fully regenerated, commit it): `content/projects/*.mdx`,
 * `public/project-covers/<slug>.{webp,png}` and `public/project-media/<slug>/*`.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { ATTACHMENTS_DIR, NOTES_DIR, noteTitle, OLDER_WORKS_COVER, readNotes, type VaultNote, wikiTarget } from './vault.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'projects');
const COVERS_DIR = path.join(ROOT, 'public', 'project-covers');
const MEDIA_DIR = path.join(ROOT, 'public', 'project-media');

const COVER_SIZE = 1024;
const MEDIA_MAX_WIDTH = 1600;
const REQUIRED_FIELDS = ['catalog', 'summary', 'status', 'year', 'genre', 'artist', 'cover', 'cover-alt'] as const;

function attachmentPath(name: string, notePath: string): string {
  const candidates = [path.join(ATTACHMENTS_DIR, name), path.join(path.dirname(notePath), name)];
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error(`${path.basename(notePath)}: attachment not found: ${name}`);
  return found;
}

/** Published notes, validated: required fields present and catalogue numbers unique. */
function publishedNotes(): VaultNote[] {
  const notes = readNotes().filter((note) => note.data.publish === true);
  const catalogs = new Map<number, string>();
  for (const note of notes) {
    const missing = REQUIRED_FIELDS.filter((field) => note.data[field] === undefined || note.data[field] === null || note.data[field] === '');
    if (missing.length > 0) throw new Error(`${path.basename(note.notePath)}: missing frontmatter ${missing.join(', ')}`);
    const catalog = Number(note.data.catalog);
    if (!Number.isInteger(catalog) || catalog < 1) throw new Error(`${note.title}: catalog must be a positive integer`);
    const clash = catalogs.get(catalog);
    if (clash) throw new Error(`catalog ${catalog} used by both ${clash} and ${note.title}`);
    catalogs.set(catalog, note.title);
  }
  return notes;
}

async function writeCover(source: string, slug: string, suffix = ''): Promise<string> {
  const base = path.join(COVERS_DIR, `${slug}${suffix}`);
  const image = sharp(source).resize(COVER_SIZE, COVER_SIZE, { fit: 'cover' });
  await image.clone().webp({ quality: 88 }).toFile(`${base}.webp`);
  // PNG copy: the Open Graph renderer cannot decode WebP.
  await image.clone().png({ compressionLevel: 9 }).toFile(`${base}.png`);
  return `/project-covers/${slug}${suffix}`;
}

/** Converts Obsidian markdown to plain markdown, copying embedded images into public/. */
async function convertBody(note: VaultNote, titlesToSlugs: Map<string, string>): Promise<string> {
  const { notePath } = note;
  const mediaDir = path.join(MEDIA_DIR, note.slug);
  let imageIndex = 0;
  const embeds = new Map<string, string>();
  for (const match of note.body.matchAll(/!\[\[([^\]]+)\]\]/g)) {
    const [name, alt = ''] = match[1].split('|').map((part) => part.trim());
    if (embeds.has(match[0]) || !/\.(png|jpe?g|webp|gif|avif)$/i.test(name)) continue;
    imageIndex += 1;
    fs.mkdirSync(mediaDir, { recursive: true });
    const fileName = `${String(imageIndex).padStart(2, '0')}.webp`;
    await sharp(attachmentPath(name, notePath))
      .rotate()
      .resize({ width: MEDIA_MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(mediaDir, fileName));
    embeds.set(match[0], `![${alt}](/project-media/${note.slug}/${fileName})`);
  }

  return note.body
    .split('\n')
    .filter((line) => !/^#\s/.test(line.trim()))
    .join('\n')
    .replace(/!\[\[[^\]]+\]\]/g, (embed) => embeds.get(embed) ?? '')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target: string, label?: string) => {
      const text = (label ?? target).trim();
      const slug = titlesToSlugs.get(noteTitle(target.trim()));
      return slug ? `[${text}](/projects/${slug})` : text;
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function frontmatter(fields: Record<string, unknown>): string {
  const lines = Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`);
  return `---\n${lines.join('\n')}\n---\n`;
}

function removeStale(dir: string, keep: Set<string>) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    if (!keep.has(entry)) fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
  }
}

async function main() {
  const notes = publishedNotes();
  const titlesToSlugs = new Map(notes.map((note) => [note.title, note.slug]));
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  fs.mkdirSync(COVERS_DIR, { recursive: true });
  fs.rmSync(MEDIA_DIR, { recursive: true, force: true });

  const keepContent = new Set<string>();
  const keepCovers = new Set<string>();
  for (const note of notes) {
    const { data, notePath } = note;
    const cover = await writeCover(attachmentPath(wikiTarget(String(data.cover)), notePath), note.slug);
    const backCover = data['back-cover']
      ? await writeCover(attachmentPath(wikiTarget(String(data['back-cover'])), notePath), note.slug, '-back')
      : undefined;
    for (const file of [cover, backCover].filter(Boolean).flatMap((base) => [`${path.basename(String(base))}.webp`, `${path.basename(String(base))}.png`])) {
      keepCovers.add(file);
    }

    const fields = {
      catalog: Number(data.catalog),
      slug: note.slug,
      title: note.title,
      summary: String(data.summary),
      year: String(data.year),
      status: String(data.status),
      format: String(data.genre),
      collaborators: String(data.artist),
      recordCover: `${cover}.webp`,
      ogCover: `${cover}.png`,
      coverUrl: `${cover}.webp`,
      coverAlt: String(data['cover-alt']),
      backCoverUrl: backCover ? `${backCover}.webp` : undefined,
      backCoverAlt: backCover ? String(data['back-cover-alt'] ?? `${note.title} back cover`) : undefined,
      outboundUrl: data.url ? String(data.url) : null,
      ambience: Array.isArray(data.ambience) && data.ambience.length === 3 ? data.ambience.map(String) : null,
    };
    const fileName = `${note.slug}.mdx`;
    fs.writeFileSync(path.join(CONTENT_DIR, fileName), `${frontmatter(fields)}\n${await convertBody(note, titlesToSlugs)}\n`);
    keepContent.add(fileName);
  }

  // The crate's back-catalogue sleeve belongs to no note: one attachment with a fixed name.
  const olderWorks = fs.readdirSync(ATTACHMENTS_DIR)
    .find((name) => path.parse(name).name === OLDER_WORKS_COVER && /\.(png|jpe?g|webp)$/i.test(name));
  if (!olderWorks) {
    throw new Error(`missing the older-works sleeve ${OLDER_WORKS_COVER}.<png|jpg|webp> in ${ATTACHMENTS_DIR} (npm run covers -- older-works)`);
  }
  await writeCover(path.join(ATTACHMENTS_DIR, olderWorks), 'older-works');
  keepCovers.add('older-works.webp');
  keepCovers.add('older-works.png');

  removeStale(CONTENT_DIR, keepContent);
  removeStale(COVERS_DIR, keepCovers);
  console.log(`Synced ${notes.length} projects from ${NOTES_DIR}`);
}

await main();
