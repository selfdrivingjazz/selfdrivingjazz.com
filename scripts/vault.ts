/** Locations and naming rules shared by the vault scripts. */
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export const VAULT = process.env.SDJ_VAULT ?? '/home/jmill/sdj/nhx4b';
export const NOTES_DIR = path.join(VAULT, 'nobody', 'publish', 'project');
export const ATTACHMENTS_DIR = path.join(VAULT, 'nobody', 'attachments');
/** Attachment basename (any image extension) of the crate's "older works" sleeve; not tied to a note. */
export const OLDER_WORKS_COVER = 'sdj-cover-older-works';

export interface VaultNote {
  title: string;
  slug: string;
  notePath: string;
  data: Record<string, unknown>;
  body: string;
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/** Note title from its filename, without the leading emoji Obsidian notes carry. */
export function noteTitle(fileName: string): string {
  return path.basename(fileName, '.md').replace(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\s)+/gu, '').trim();
}

/** Every project note, published or not. */
export function readNotes(): VaultNote[] {
  return fs.readdirSync(NOTES_DIR)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((file) => {
      const notePath = path.join(NOTES_DIR, file);
      const { data, content } = matter(fs.readFileSync(notePath, 'utf8'));
      const title = noteTitle(file);
      return { title, slug: slugify(title), notePath, data, body: content };
    });
}

export function findNote(slug: string): VaultNote {
  const note = readNotes().find((candidate) => candidate.slug === slug);
  if (!note) throw new Error(`No vault note in ${NOTES_DIR} whose title slugifies to "${slug}"`);
  return note;
}

/** `"[[file.png]]"`, `"[[file.png|alt]]"` or a bare filename → the filename. */
export function wikiTarget(value: string): string {
  return value.replace(/^!?\[\[/, '').replace(/\]\]$/, '').split('|')[0].trim();
}
