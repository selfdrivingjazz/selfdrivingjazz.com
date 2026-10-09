/**
 * Makes an image a cover in the Obsidian vault, then `npm run sync:vault`.
 *
 *   npm run use-cover -- <slug> <image> [--back] [--alt "screen-reader description"]
 *   npm run use-cover -- older-works <image>
 *
 * Copies the image into the vault attachments as sdj-cover-<slug>[-back].<ext> (or a dated name when
 * that file already holds a different image) and points the note's `cover` / `back-cover` at it.
 * Alt text comes from --alt, else from the concepts.json written by `npm run covers` next to the image.
 * "older-works" sets the crate's back-catalogue sleeve, which belongs to no note.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ATTACHMENTS_DIR, findNote, OLDER_WORKS_COVER } from './vault.ts';

interface UseCoverOptions {
  slug: string;
  image: string;
  back: boolean;
  alt?: string;
}

function parseArgs(argv: string[]): UseCoverOptions {
  const [slug, image, ...rest] = argv;
  if (!slug || !image) throw new Error('usage: npm run use-cover -- <slug> <image> [--back] [--alt "..."]');
  const options: UseCoverOptions = { slug, image: path.resolve(image), back: false };
  for (let index = 0; index < rest.length; index += 1) {
    if (rest[index] === '--alt') options.alt = rest[++index];
    else if (rest[index] === '--back') options.back = true;
    else throw new Error(`unknown option ${rest[index]}`);
  }
  return options;
}

function altFromConcepts(image: string): string | undefined {
  const conceptsPath = path.join(path.dirname(image), 'concepts.json');
  if (!fs.existsSync(conceptsPath)) return undefined;
  const concepts: Array<{ file: string; alt?: string }> = JSON.parse(fs.readFileSync(conceptsPath, 'utf8'));
  return concepts.find((entry) => entry.file === path.basename(image))?.alt;
}

/** Sets `key: value` in the note's frontmatter, replacing an existing line or appending one. */
function setFrontmatter(text: string, key: string, value: string): string {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!match) throw new Error('note has no frontmatter block');
  const line = `${key}: ${JSON.stringify(value)}`;
  const pattern = new RegExp(`^${key}:.*$`, 'm');
  const block = pattern.test(match[1]) ? match[1].replace(pattern, line) : `${match[1]}\n${line}`;
  return `---\n${block}\n---\n${text.slice(match[0].length)}`;
}

/** Copies the image into the attachments under `baseName`, keeping any different existing file. */
function copyIntoVault(image: string, baseName: string): string {
  const extension = path.extname(image).toLowerCase();
  let fileName = `${baseName}${extension}`;
  const existing = path.join(ATTACHMENTS_DIR, fileName);
  if (fs.existsSync(existing) && !fs.readFileSync(existing).equals(fs.readFileSync(image))) {
    fileName = `${baseName}-${new Date().toISOString().slice(0, 10)}${extension}`;
  }
  fs.copyFileSync(image, path.join(ATTACHMENTS_DIR, fileName));
  return fileName;
}

function useOlderWorks(image: string) {
  // The sync reads exactly one file named OLDER_WORKS_COVER.<ext>; replace it outright.
  for (const name of fs.readdirSync(ATTACHMENTS_DIR)) {
    if (path.parse(name).name === OLDER_WORKS_COVER) fs.rmSync(path.join(ATTACHMENTS_DIR, name));
  }
  const fileName = `${OLDER_WORKS_COVER}${path.extname(image).toLowerCase()}`;
  fs.copyFileSync(image, path.join(ATTACHMENTS_DIR, fileName));
  console.log(`Older works sleeve → ${fileName}\nNext: npm run sync:vault, review locally, commit, then redeploy the tailnet preview.`);
}

function main() {
  const { slug, image, back, alt: altArg } = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(image)) throw new Error(`no such image: ${image}`);
  if (slug === 'older-works') {
    useOlderWorks(image);
    return;
  }

  const note = findNote(slug);
  const coverKey = back ? 'back-cover' : 'cover';
  const altKey = `${coverKey}-alt`;
  const alt = altArg ?? altFromConcepts(image) ?? (typeof note.data[altKey] === 'string' ? note.data[altKey] : undefined);
  if (!alt) throw new Error(`no alt text: pass --alt "…" (no concepts.json next to the image and the note has no ${altKey})`);

  const fileName = copyIntoVault(image, `sdj-cover-${slug}${back ? '-back' : ''}`);
  let text = fs.readFileSync(note.notePath, 'utf8');
  text = setFrontmatter(text, coverKey, `[[${fileName}]]`);
  text = setFrontmatter(text, altKey, alt);
  fs.writeFileSync(note.notePath, text);
  console.log(`${note.title}: ${coverKey} → ${fileName}\nNext: npm run sync:vault, review locally, commit, then redeploy the tailnet preview.`);
}

main();
