/**
 * Generates record-cover candidates for a project with Codex image generation (billed to the
 * ChatGPT plan Codex is signed in with), then publishes them to MTS Outputs for review.
 *
 *   npm run covers -- <slug> [--count 3] [--direction "extra art direction"] [--with-references] [--no-publish]
 *
 * <slug> is the slugified vault note title (e.g. "whoup"); the note does not need a cover yet.
 * Candidates and their concepts.json land in design/.candidates/<slug>/<run>/ (gitignored).
 * Pick one with `npm run use-cover -- <slug> <candidate.png>`.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { findNote, readNotes } from './vault.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIRECTION_PATH = path.join(ROOT, 'design', 'cover-direction.md');
const REFERENCES_DIR = path.join(ROOT, 'design', 'cover-references');
const CANDIDATES_DIR = path.join(ROOT, 'design', '.candidates');
const PUBLISH_SCRIPT = path.join(process.env.HOME ?? '', '.omp/agent/skills/publish-output/scripts/publish.py');
const WRITEUP_LIMIT = 2000;

interface Concept {
  file: string;
  series?: string;
  concept: string;
  alt: string;
}

interface CoverRunOptions {
  slug: string;
  count: number;
  direction: string;
  /** Attach design/cover-references/ images. Off by default: the model copies them too literally. */
  withReferences: boolean;
  publish: boolean;
}

function parseArgs(argv: string[]): CoverRunOptions {
  const [slug, ...rest] = argv;
  if (!slug || slug.startsWith('--')) throw new Error('usage: npm run covers -- <slug> [--count N] [--direction "..."] [--with-references] [--no-publish]');
  const options: CoverRunOptions = { slug, count: 3, direction: '', withReferences: false, publish: true };
  for (let index = 0; index < rest.length; index += 1) {
    const flag = rest[index];
    if (flag === '--count') options.count = Number(rest[++index]);
    else if (flag === '--direction') options.direction = rest[++index] ?? '';
    else if (flag === '--with-references') options.withReferences = true;
    else if (flag === '--no-publish') options.publish = false;
    else throw new Error(`unknown option ${flag}`);
  }
  if (!Number.isInteger(options.count) || options.count < 1 || options.count > 6) throw new Error('--count must be 1–6');
  return options;
}

/** Prose without Obsidian embeds/links, trimmed to keep the brief focused. */
function writeupExcerpt(body: string): string {
  const prose = body
    .split('\n')
    .filter((line) => !/^#\s/.test(line.trim()))
    .join('\n')
    .replace(/!\[\[[^\]]+\]\]/g, '')
    .replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target: string, label?: string) => label ?? target)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return prose.length > WRITEUP_LIMIT ? `${prose.slice(0, WRITEUP_LIMIT)}…` : prose;
}

function catalogMark(catalog: unknown): string {
  const number = Number(catalog) || Math.max(0, ...readNotes().map((note) => Number(note.data.catalog) || 0)) + 1;
  return `SDJ ${String(number).padStart(3, '0')}`;
}

/** The `### ` headings under `## Series` in the art direction. */
function seriesNames(direction: string): string[] {
  const section = direction.split(/^## /m).find((part) => part.startsWith('Series'));
  return section ? [...section.matchAll(/^### (.+)$/gm)].map((match) => match[1].trim()) : [];
}

/** A random, non-repeating series per candidate so a run spans the catalogue's idioms. */
function assignSeries(direction: string, count: number): string[] {
  const names = seriesNames(direction);
  for (let index = names.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [names[index], names[swap]] = [names[swap], names[index]];
  }
  return Array.from({ length: count }, (_, index) => names[index % Math.max(1, names.length)] ?? 'any series');
}

function buildPrompt(options: CoverRunOptions, references: string[]): string {
  const note = findNote(options.slug);
  const { data } = note;
  const direction = fs.readFileSync(DIRECTION_PATH, 'utf8');
  const files = Array.from({ length: options.count }, (_, index) => `candidate-${index + 1}.png`);
  const series = assignSeries(direction, options.count);
  return [
    '$imagegen',
    `Create ${options.count} distinct record-cover candidates for a Self-Driving Jazz project, following the art direction below.`,
    references.length > 0
      ? `The ${references.length} attached images are covers already in the catalogue. They show the level of taste expected, nothing more: do not reuse their layouts, palettes, type treatment or motifs.`
      : '',
    '',
    direction,
    '## The project',
    `- Title (spelled exactly; case is your choice): "${note.title}"`,
    `- Catalogue mark (optional, tiny): "${catalogMark(data.catalog)}"`,
    data.summary ? `- Summary: ${String(data.summary)}` : '',
    data.tagline ? `- Tagline: ${String(data.tagline)}` : '',
    data.genre ? `- Kind of project: ${String(data.genre)}` : '',
    data.year ? `- Year: ${String(data.year)}` : '',
    '',
    'Write-up:',
    writeupExcerpt(note.body),
    options.direction ? `\n## Extra direction for this run\n${options.direction}` : '',
    '',
    '## Deliverables',
    '1. For each candidate, first decide its one-sentence concept from what the project is, then generate it inside its assigned series:',
    ...files.map((file, index) => `   - ${file}: ${series[index]}`),
    `2. Save the images in the current directory as ${files.join(', ')}.`,
    '3. Write concepts.json in the current directory: a JSON array of {"file", "series", "concept", "alt"} — concept is the one-sentence idea; alt is a plain description of the image for screen readers, at most 140 characters.',
    'Do not create or modify any other files.',
  ].filter((line) => line !== '').join('\n');
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const note = findNote(options.slug);
  const references = options.withReferences
    ? fs.readdirSync(REFERENCES_DIR)
      .filter((name) => /\.(png|jpe?g)$/i.test(name))
      .sort()
      .map((name) => path.join(REFERENCES_DIR, name))
    : [];
  const run = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 13);
  const workDir = path.join(CANDIDATES_DIR, options.slug, run);
  fs.mkdirSync(workDir, { recursive: true });
  const prompt = buildPrompt(options, references);
  fs.writeFileSync(path.join(workDir, 'prompt.md'), prompt);

  console.log(`Generating ${options.count} candidates for ${note.title} in ${path.relative(ROOT, workDir)} (≈80s each)…`);
  const codex = spawnSync(
    'codex',
    ['exec', '--skip-git-repo-check', '--sandbox', 'workspace-write', ...references.flatMap((file) => ['--image', file]), '-'],
    { cwd: workDir, input: prompt, stdio: ['pipe', 'inherit', 'inherit'], encoding: 'utf8' },
  );
  if (codex.status !== 0) throw new Error(`codex exited with status ${codex.status}`);

  const conceptsPath = path.join(workDir, 'concepts.json');
  const concepts: Concept[] = fs.existsSync(conceptsPath) ? JSON.parse(fs.readFileSync(conceptsPath, 'utf8')) : [];
  const images = fs.readdirSync(workDir).filter((name) => /^candidate-\d+\.png$/.test(name)).sort();
  if (images.length === 0) throw new Error(`codex produced no candidate images in ${workDir}`);
  for (const image of images) {
    const concept = concepts.find((entry) => entry.file === image)?.concept ?? '(no concept recorded)';
    console.log(`  ${path.join(workDir, image)}\n    ${concept}`);
  }

  if (!options.publish) return;
  const publishArgs = [
    PUBLISH_SCRIPT,
    '--id', `sdj-covers-${options.slug}-${run}`.toLowerCase(),
    '--title', `Cover candidates — ${note.title}`,
    '--summary', `Pick one with: npm run use-cover -- ${options.slug} ${path.relative(ROOT, workDir)}/candidate-N.png`,
    ...images.flatMap((image) => {
      const entry = concepts.find((candidate) => candidate.file === image);
      const label = entry ? `${entry.series ? `${entry.series} — ` : ''}${entry.concept}` : image;
      return ['--file', path.join(workDir, image), '--label', `${image}: ${label}`.slice(0, 240)];
    }),
  ];
  const publish = spawnSync('python3', publishArgs, { stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' });
  if (publish.status !== 0) throw new Error(`publishing to MTS failed (status ${publish.status}): ${publish.stdout}`);
  console.log(`Review: ${JSON.parse(publish.stdout).url}`);
}

main();
