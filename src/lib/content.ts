import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

import type { MethodSection, Project } from '../data/content-types';

const CONTENT_ROOT = path.join(process.cwd(), 'content');
const PROJECTS_ROOT = path.join(CONTENT_ROOT, 'projects');
const METHOD_ROOT = path.join(CONTENT_ROOT, 'method');

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
  const data = document.data as Omit<Project, 'content'>;
  return {
    ...data,
    content: includeContent ? document.content.trim() : undefined,
  };
}

export function getProjects(): Project[] {
  return contentFiles(PROJECTS_ROOT)
    .map((filename) => readProject(filename, false))
    .sort((left, right) => left.order - right.order);
}

export function getProject(slug: string): Project | undefined {
  const filename = `${slug}.mdx`;
  if (!fs.existsSync(path.join(PROJECTS_ROOT, filename))) return undefined;
  return readProject(filename, true);
}

export function getMethodSections(): MethodSection[] {
  return contentFiles(METHOD_ROOT)
    .map((filename) => {
      const document = readDocument(METHOD_ROOT, filename);
      const data = document.data as Omit<MethodSection, 'detail'>;
      return { ...data, detail: document.content.trim() };
    })
    .sort((left, right) => left.order - right.order);
}
