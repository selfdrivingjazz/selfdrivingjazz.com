/**
 * Generates the site's project content from the Obsidian vault.
 *
 *   npm run sync:vault                 # vault at /home/jmill/sdj/nhx4b
 *   SDJ_VAULT=/path/to/vault npm run sync:vault
 *
 * Source: every note in `nobody/publish/project/` with `publish: true`.
 * Output (fully regenerated, commit it): `content/projects/*.mdx`, `content/older-works.json`,
 * `public/project-covers/<name>-<hash>.{webp,png}` and `public/project-media/<slug>/*`.
 * Image filenames carry a content hash so replacing an image always changes its URL. Cover colours (ambience
 * palettes, placeholder, average colour) are computed here from the artwork, so the site never decodes images.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { type CoverColors, coverColors } from './cover-palette.ts';
import { ATTACHMENTS_DIR, NOTES_DIR, noteTitle, OLDER_WORKS_COVER, readNotes, type VaultNote, wikiTarget } from './vault.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'projects');
const COVERS_DIR = path.join(ROOT, 'public', 'project-covers');
const MEDIA_DIR = path.join(ROOT, 'public', 'project-media');
const OLDER_WORKS_MANIFEST = path.join(ROOT, 'content', 'older-works.json');

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

/** Short content hash, so a changed image always gets a new URL (no stale browser or optimizer cache). */
function contentHash(file: string): string {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 10);
}

/** Writes `<name>-<hash>.{webp,png}`; returns the public base path without extension and the cover's colours. */
async function writeCover(source: string, name: string): Promise<CoverColors & { base: string }> {
  const fileBase = `${name}-${contentHash(source)}`;
  const image = sharp(source).resize(COVER_SIZE, COVER_SIZE, { fit: 'cover' });
  await image.clone().webp({ quality: 88 }).toFile(path.join(COVERS_DIR, `${fileBase}.webp`));
  // PNG copy: the Open Graph renderer cannot decode WebP.
  await image.clone().png({ compressionLevel: 9 }).toFile(path.join(COVERS_DIR, `${fileBase}.png`));
  return { base: `/project-covers/${fileBase}`, ...await coverColors(source) };
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
    const source = attachmentPath(name, notePath);
    const fileName = `${String(imageIndex).padStart(2, '0')}-${contentHash(source)}.webp`;
    await sharp(source)
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
  const keepCover = (base: string | undefined) => {
    if (!base) return;
    keepCovers.add(`${path.basename(base)}.webp`);
    keepCovers.add(`${path.basename(base)}.png`);
  };
  for (const note of notes) {
    const { data, notePath } = note;
    const cover = await writeCover(attachmentPath(wikiTarget(String(data.cover)), notePath), note.slug);
    const backCover = data['back-cover']
      ? await writeCover(attachmentPath(wikiTarget(String(data['back-cover'])), notePath), `${note.slug}-back`)
      : undefined;
    keepCover(cover.base);
    keepCover(backCover?.base);

    const fields = {
      catalog: Number(data.catalog),
      slug: note.slug,
      title: note.title,
      summary: String(data.summary),
      year: String(data.year),
      status: String(data.status),
      format: String(data.genre),
      collaborators: String(data.artist),
      recordCover: `${cover.base}.webp`,
      ogCover: `${cover.base}.png`,
      coverUrl: `${cover.base}.webp`,
      coverAlt: String(data['cover-alt']),
      backCoverUrl: backCover ? `${backCover.base}.webp` : undefined,
      backCoverAlt: backCover ? String(data['back-cover-alt'] ?? `${note.title} back cover`) : undefined,
      outboundUrl: data.url ? String(data.url) : null,
      ambience: cover.ambience,
      backAmbience: backCover?.ambience,
      placeholder: cover.placeholder,
      coverColor: cover.coverColor,
    };
    const fileName = `${note.slug}.mdx`;
    fs.writeFileSync(path.join(CONTENT_DIR, fileName), `${frontmatter(fields)}\n${await convertBody(note, titlesToSlugs)}\n`);
    keepContent.add(fileName);
  }

  // The crate's back-catalogue sleeve belongs to no note: fixed attachment names, the back optional.
  // Its hashed URLs and colours go into a small manifest the homepage reads.
  const findAttachment = (baseName: string) => fs.readdirSync(ATTACHMENTS_DIR)
    .find((name) => path.parse(name).name === baseName && /\.(png|jpe?g|webp)$/i.test(name));
  const olderWorks = findAttachment(OLDER_WORKS_COVER);
  if (!olderWorks) {
    throw new Error(`missing the older-works sleeve ${OLDER_WORKS_COVER}.<png|jpg|webp> in ${ATTACHMENTS_DIR} (npm run covers -- older-works)`);
  }
  const olderWorksBack = findAttachment(`${OLDER_WORKS_COVER}-back`);
  const olderWorksCover = await writeCover(path.join(ATTACHMENTS_DIR, olderWorks), 'older-works');
  const olderWorksBackCover = olderWorksBack
    ? await writeCover(path.join(ATTACHMENTS_DIR, olderWorksBack), 'older-works-back')
    : undefined;
  keepCover(olderWorksCover.base);
  keepCover(olderWorksBackCover?.base);
  fs.writeFileSync(OLDER_WORKS_MANIFEST, `${JSON.stringify({
    coverUrl: `${olderWorksCover.base}.webp`,
    coverColor: olderWorksCover.coverColor,
    ambience: olderWorksCover.ambience,
    backCoverUrl: olderWorksBackCover ? `${olderWorksBackCover.base}.webp` : undefined,
    backAmbience: olderWorksBackCover?.ambience,
  }, null, 2)}\n`);

  removeStale(CONTENT_DIR, keepContent);
  removeStale(COVERS_DIR, keepCovers);
  console.log(`Synced ${notes.length} projects from ${NOTES_DIR}`);
}

await main();
