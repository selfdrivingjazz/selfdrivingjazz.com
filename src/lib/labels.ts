/** Catalogue label code for a release, e.g. `SDJ-014`. Projects are ordered newest first. */
export function labelCode(projectCount: number, index: number): string {
  return `SDJ-${String(projectCount - index).padStart(3, '0')}`;
}
