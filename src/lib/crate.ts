/** Releases shown as their own sleeves on the homepage crate; older ones share the "older works" sleeve. */
const CRATE_RELEASES = 7;
export const OLDER_WORKS_ID = 'older-works';

/** What the crate needs to know about a release. */
export interface CrateCandidate {
  catalog: number;
  /** Where the release stands in the crate, compared like a catalogue number; `null` keeps it out. */
  crateSlot: number | null;
}

/**
 * A vault note's `crate` field → its crate slot. Omitted: its own catalogue number. `false`: never in the crate.
 * A number: stands in the crate as if it were that catalogue number, so newer releases push it out as usual.
 */
export function crateSlot(catalog: number, crate: unknown): number | null {
  if (crate === undefined || crate === null) return catalog;
  if (crate === false) return null;
  if (typeof crate === 'number' && Number.isFinite(crate)) return crate;
  throw new Error(`crate must be false or a catalogue number, got ${JSON.stringify(crate)}`);
}

/**
 * The crate's own sleeves (highest slot first) and every other release, newest first, behind the "older works"
 * sleeve.
 */
export function splitCrate<T extends CrateCandidate>(releases: readonly T[]): { featured: T[]; older: T[] } {
  const featured = releases
    .filter((release) => release.crateSlot !== null)
    .sort((left, right) => right.crateSlot! - left.crateSlot! || right.catalog - left.catalog)
    .slice(0, CRATE_RELEASES);
  const older = releases
    .filter((release) => !featured.includes(release))
    .sort((left, right) => right.catalog - left.catalog);
  return { featured, older };
}

/** Homepage anchor that brings the crate back to `slug`'s record, or to the older-works sleeve holding it. */
export function crateHref(slug: string, inCrate: boolean): string {
  return `/#${inCrate ? slug : OLDER_WORKS_ID}`;
}
