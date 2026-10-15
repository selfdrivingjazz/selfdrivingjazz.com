import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

import type { OlderWorksSleeve, Project } from '../data/content-types';

const CONTENT_ROOT = path.join(process.cwd(), 'content');
const PROJECTS_ROOT = path.join(CONTENT_ROOT, 'projects');

function contentFiles(root: string): string[] {
  return fs.readdirSync(root)
    .filter((filename) => filename.endsWith('.mdx'))
    .sort();
}

function readDocument(root: string, filename: string) {
  const source = fs.readFileSync(path.join(root, filename), 'utf8');
  return matter(source);
}

function readProject(filename: string, includeContent: boolean): Project {
  const document = readDocument(PROJECTS_ROOT, filename);
  return {
    ...document.data as Omit<Project, 'content'>,
    content: includeContent ? document.content.trim() : undefined,
  };
}

export async function getProjects(): Promise<Project[]> {
  const projects = contentFiles(PROJECTS_ROOT).map((filename) => readProject(filename, false));
  return projects.sort((left, right) => right.catalog - left.catalog);
}

export async function getProject(slug: string): Promise<Project | undefined> {
  const filename = `${slug}.mdx`;
  if (!fs.existsSync(path.join(PROJECTS_ROOT, filename))) return undefined;
  return readProject(filename, true);
}

/** Written by `npm run sync:vault` from the vault's sdj-cover-older-works[-back] attachments. */
const OLDER_WORKS_MANIFEST = path.join(CONTENT_ROOT, 'older-works.json');

/** The crate's back-catalogue sleeve: image URLs and their generated colours. */
export async function getOlderWorksSleeve(): Promise<OlderWorksSleeve> {
  return JSON.parse(fs.readFileSync(OLDER_WORKS_MANIFEST, 'utf8')) as OlderWorksSleeve;
}
