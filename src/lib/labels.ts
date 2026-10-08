/** Catalogue label code for a release, e.g. `SDJ-014`. */
export function labelCode(catalog: number): string {
  return `SDJ-${String(catalog).padStart(3, '0')}`;
}
