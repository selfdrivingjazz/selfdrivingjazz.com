/**
 * Makes an image the cover of a project in the Obsidian vault, then `npm run sync:vault`.
 *
 *   npm run use-cover -- <slug> <image> [--alt "screen-reader description"]
 *
 * Copies the image into the vault attachments as sdj-cover-<slug>.<ext> (or a dated name when
 * that file already holds a different cover) and points the note's `cover` at it. Alt text comes
 * from --alt, else from the concepts.json written by `npm run covers` next to the image.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ATTACHMENTS_DIR, findNote } from './vault.ts';

function parseArgs(argv: string[]) {
  const [slug, image, ...rest] = argv;
  if (!slug || !image) throw new Error('usage: npm run use-cover -- <slug> <image> [--alt "..."]');
  let alt: string | undefined;
  for (let index = 0; index < rest.length; index += 1) {
    if (rest[index] === '--alt') alt = rest[++index];
    else throw new Error(`unknown option ${rest[index]}`);
  }
  return { slug, image: path.resolve(image), alt };
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

function main() {
  const { slug, image, alt: altArg } = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(image)) throw new Error(`no such image: ${image}`);
  const note = findNote(slug);
  const alt = altArg ?? altFromConcepts(image) ?? (typeof note.data['cover-alt'] === 'string' ? note.data['cover-alt'] : undefined);
  if (!alt) throw new Error('no alt text: pass --alt "…" (no concepts.json next to the image and the note has no cover-alt)');

  const extension = path.extname(image).toLowerCase();
  let fileName = `sdj-cover-${slug}${extension}`;
  const existing = path.join(ATTACHMENTS_DIR, fileName);
  if (fs.existsSync(existing) && !fs.readFileSync(existing).equals(fs.readFileSync(image))) {
    fileName = `sdj-cover-${slug}-${new Date().toISOString().slice(0, 10)}${extension}`;
  }
  fs.copyFileSync(image, path.join(ATTACHMENTS_DIR, fileName));

  let text = fs.readFileSync(note.notePath, 'utf8');
  text = setFrontmatter(text, 'cover', `[[${fileName}]]`);
  text = setFrontmatter(text, 'cover-alt', alt);
  fs.writeFileSync(note.notePath, text);
  console.log(`${note.title}: cover → ${fileName}\nNext: npm run sync:vault, review locally, commit, then redeploy the tailnet preview.`);
}

main();
