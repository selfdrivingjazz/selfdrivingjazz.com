/**
 * Generates record-cover candidates with Codex image generation (billed to the ChatGPT plan Codex
 * is signed in with), then publishes them to MTS Outputs for review.
 *
 *   npm run covers -- <slug> [--back] [--count 3] [--direction "…"] [--with-references] [--no-publish]
 *   npm run covers -- older-works [--count 3] …
 *
 * <slug> is the slugified vault note title (e.g. "whoup"); the note does not need a cover yet.
 * --back designs the reverse of the sleeve, using the note's current `cover` as the front.
 * "older-works" designs the crate's back-catalogue sleeve from the older releases.
 * Candidates and concepts.json land in design/.candidates/<slug>[-back]/<run>/ (gitignored).
 * Pick one with `npm run use-cover -- <slug> <candidate.png> [--back]`.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { CRATE_RELEASES } from '../src/lib/crate.ts';
import { ATTACHMENTS_DIR, findNote, OLDER_WORKS_COVER, readNotes, type VaultNote, wikiTarget } from './vault.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIRECTION_PATH = path.join(ROOT, 'design', 'cover-direction.md');
const REFERENCES_DIR = path.join(ROOT, 'design', 'cover-references');
const CANDIDATES_DIR = path.join(ROOT, 'design', '.candidates');
const PUBLISH_SCRIPT = path.join(process.env.HOME ?? '', '.omp/agent/skills/publish-output/scripts/publish.py');
const WRITEUP_LIMIT = 2000;
const OLDER_WORKS = 'older-works';

interface Concept {
  file: string;
  series?: string;
  concept: string;
  alt: string;
}

interface CoverRunOptions {
  slug: string;
  back: boolean;
  count: number;
  direction: string;
  /** Attach design/cover-references/ images. Off by default: the model copies them too literally. */
  withReferences: boolean;
  publish: boolean;
}

/** What the cover is for: the text brief plus any images the model must build on. */
interface CoverSubject {
  title: string;
  catalogMark: string | null;
  brief: string[];
  /** Images that are part of the assignment (e.g. the front of the sleeve), not style references. */
  inputs: string[];
}

const USAGE = 'usage: npm run covers -- <slug> [--back] [--count N] [--direction "..."] [--with-references] [--no-publish]';

function parseArgs(argv: string[]): CoverRunOptions {
  const [slug, ...rest] = argv;
  if (!slug || slug.startsWith('--')) throw new Error(USAGE);
  const options: CoverRunOptions = { slug, back: false, count: 3, direction: '', withReferences: false, publish: true };
  for (let index = 0; index < rest.length; index += 1) {
    const flag = rest[index];
    if (flag === '--count') options.count = Number(rest[++index]);
    else if (flag === '--back') options.back = true;
    else if (flag === '--direction') options.direction = rest[++index] ?? '';
    else if (flag === '--with-references') options.withReferences = true;
    else if (flag === '--no-publish') options.publish = false;
    else throw new Error(`unknown option ${flag}\n${USAGE}`);
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

const BACK_BRIEF = [
  '',
  '## Back cover',
  'Design the BACK of this sleeve. The first attached image is its approved front cover.',
  'The back belongs to the same printed object: same paper, inks, palette and visual language, but a',
  'different composition that extends the front\'s idea — the pattern continued or reversed, the motif',
  'seen from another angle, a detail enlarged, the scene a moment later. It must read as the reverse,',
  'not a copy. Keep it calmer than the front. Text: at most the title and catalogue mark, small.',
];

function projectSubject(note: VaultNote, back: boolean): CoverSubject {
  const { data } = note;
  const brief = [
    '## The project',
    data.summary ? `- Summary: ${String(data.summary)}` : '',
    data.tagline ? `- Tagline: ${String(data.tagline)}` : '',
    data.genre ? `- Kind of project: ${String(data.genre)}` : '',
    data.year ? `- Year: ${String(data.year)}` : '',
    '',
    'Write-up:',
    writeupExcerpt(note.body),
  ];
  if (!back) return { title: note.title, catalogMark: catalogMark(data.catalog), brief, inputs: [] };

  if (!data.cover) throw new Error(`${note.title} has no cover yet; pick the front before designing the back`);
  const front = path.join(ATTACHMENTS_DIR, wikiTarget(String(data.cover)));
  if (!fs.existsSync(front)) throw new Error(`front cover not found: ${front}`);
  return { title: note.title, catalogMark: catalogMark(data.catalog), brief: [...brief, ...BACK_BRIEF], inputs: [front] };
}

/** The sleeve at the back of the crate standing in for every release not shown individually. */
function olderWorksSubject(back: boolean): CoverSubject {
  const published = readNotes()
    .filter((note) => note.data.publish === true)
    .sort((left, right) => Number(right.data.catalog) - Number(left.data.catalog));
  const older = published.slice(CRATE_RELEASES);
  if (older.length === 0) throw new Error('no older releases: every project has its own sleeve in the crate');
  const brief = [
    '## The sleeve',
    'This is not one project: it is the compilation sleeve at the back of the record crate that holds the',
    'catalogue\'s older releases — an archive, an anthology, the back catalogue. Its idea should be about',
    'accumulation, archive, time or the catalogue itself rather than any single release.',
    'The releases it collects, for context only (do not depict or name them):',
    ...older.map((note) => `- ${note.title} (${String(note.data.year)}): ${String(note.data.summary)}`),
  ];
  if (!back) return { title: 'Older Works', catalogMark: null, brief, inputs: [] };

  const front = fs.readdirSync(ATTACHMENTS_DIR).find((name) => path.parse(name).name === OLDER_WORKS_COVER);
  if (!front) throw new Error(`no older-works front yet (${OLDER_WORKS_COVER}.*); pick it before designing the back`);
  return { title: 'Older Works', catalogMark: null, brief: [...brief, ...BACK_BRIEF], inputs: [path.join(ATTACHMENTS_DIR, front)] };
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

function buildPrompt(options: CoverRunOptions, subject: CoverSubject, references: string[]): string {
  const direction = fs.readFileSync(DIRECTION_PATH, 'utf8');
  const files = Array.from({ length: options.count }, (_, index) => `candidate-${index + 1}.png`);
  const assignments = options.back
    ? files.map((file) => `   - ${file}: the reverse of the front, in its series`)
    : assignSeries(direction, options.count).map((series, index) => `   - ${files[index]}: ${series}`);
  return [
    '$imagegen',
    `Create ${options.count} distinct record-${options.back ? 'sleeve back' : 'cover'} candidates for Self-Driving Jazz, following the art direction below.`,
    references.length > 0
      ? `The last ${references.length} attached images are covers already in the catalogue. They show the level of taste expected, nothing more: do not reuse their layouts, palettes, type treatment or motifs.`
      : '',
    '',
    direction,
    '## Lettering',
    `- Title (spelled exactly; case is your choice): "${subject.title}"`,
    subject.catalogMark ? `- Catalogue mark (optional, tiny): "${subject.catalogMark}"` : '- No catalogue mark.',
    '',
    ...subject.brief,
    options.direction ? `\n## Extra direction for this run\n${options.direction}` : '',
    '',
    '## Deliverables',
    `1. For each candidate, first decide its one-sentence concept, then generate it${options.back ? '' : ' inside its assigned series'}:`,
    ...assignments,
    `2. Save the images in the current directory as ${files.join(', ')}.`,
    '3. Write concepts.json in the current directory: a JSON array of {"file", "series", "concept", "alt"} — concept is the one-sentence idea; alt is a plain description of the image for screen readers, at most 140 characters.',
    'Do not create or modify any other files.',
  ].filter((line) => line !== '').join('\n');
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const subject = options.slug === OLDER_WORKS ? olderWorksSubject(options.back) : projectSubject(findNote(options.slug), options.back);
  const references = options.withReferences
    ? fs.readdirSync(REFERENCES_DIR)
      .filter((name) => /\.(png|jpe?g)$/i.test(name))
      .sort()
      .map((name) => path.join(REFERENCES_DIR, name))
    : [];
  const target = options.back ? `${options.slug}-back` : options.slug;
  const run = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 13);
  const workDir = path.join(CANDIDATES_DIR, target, run);
  fs.mkdirSync(workDir, { recursive: true });
  const prompt = buildPrompt(options, subject, references);
  fs.writeFileSync(path.join(workDir, 'prompt.md'), prompt);

  console.log(`Generating ${options.count} ${options.back ? 'back' : 'cover'} candidates for ${subject.title} in ${path.relative(ROOT, workDir)} (≈80s each)…`);
  const images = [...subject.inputs, ...references];
  const codex = spawnSync(
    'codex',
    ['exec', '--skip-git-repo-check', '--sandbox', 'workspace-write', ...images.flatMap((file) => ['--image', file]), '-'],
    { cwd: workDir, input: prompt, stdio: ['pipe', 'inherit', 'inherit'], encoding: 'utf8' },
  );
  if (codex.status !== 0) throw new Error(`codex exited with status ${codex.status}`);

  const conceptsPath = path.join(workDir, 'concepts.json');
  const concepts: Concept[] = fs.existsSync(conceptsPath) ? JSON.parse(fs.readFileSync(conceptsPath, 'utf8')) : [];
  const candidates = fs.readdirSync(workDir).filter((name) => /^candidate-\d+\.png$/.test(name)).sort();
  if (candidates.length === 0) throw new Error(`codex produced no candidate images in ${workDir}`);
  for (const image of candidates) {
    const concept = concepts.find((entry) => entry.file === image)?.concept ?? '(no concept recorded)';
    console.log(`  ${path.join(workDir, image)}\n    ${concept}`);
  }

  if (!options.publish) return;
  const useCommand = `npm run use-cover -- ${options.slug} ${path.relative(ROOT, workDir)}/candidate-N.png${options.back ? ' --back' : ''}`;
  const publishArgs = [
    PUBLISH_SCRIPT,
    '--id', `sdj-covers-${target}-${run}`.toLowerCase(),
    '--title', `${options.back ? 'Back cover' : 'Cover'} candidates — ${subject.title}`,
    '--summary', `Pick one with: ${useCommand}`,
    ...subject.inputs.flatMap((file) => ['--file', file, '--label', 'Approved front cover (for comparison)']),
    ...candidates.flatMap((image) => {
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
