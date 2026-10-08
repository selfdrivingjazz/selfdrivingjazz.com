/** Releases shown as their own sleeves on the homepage crate; older ones share the "older works" sleeve. */
export const CRATE_RELEASES = 7;
export const OLDER_WORKS_ID = 'older-works';

/** Homepage anchor that brings the crate back to the record for the project at `index` (newest first). */
export function crateHref(index: number, slug: string): string {
  return `/#${index < CRATE_RELEASES ? slug : OLDER_WORKS_ID}`;
}
