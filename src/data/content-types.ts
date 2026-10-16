export interface Project {
  /** Catalogue number from the vault note; the label code is `SDJ-<catalog>` and higher is newer. */
  catalog: number;
  slug: string;
  title: string;
  summary: string;
  year: string;
  status: string;
  format: string;
  collaborators: string;
  recordCover: string;
  ogCover: string;
  coverUrl: string;
  coverAlt: string;
  backCoverUrl?: string;
  backCoverAlt?: string;
  outboundUrl: string | null;
  /**
   * Three colours representing the front cover, [dominant, strongest accent, next accent], generated from the
   * artwork by `npm run sync:vault`.
   */
  ambience: readonly [string, string, string];
  /** Same, from the back cover; absent without one (use `ambience`). */
  backAmbience?: readonly [string, string, string];
  /** CSS background approximating the cover's colours, shown until the image loads (generated). */
  placeholder: string;
  /** Average cover colour (hex), for surfaces that can't use a gradient (WebGL sleeves; generated). */
  coverColor: string;
  content?: string;
}

/** The crate's "older works" sleeve, standing in for releases beyond the featured ones. Colours as on `Project`. */
export interface OlderWorksSleeve {
  coverUrl: string;
  coverColor: string;
  ambience: readonly [string, string, string];
  backCoverUrl?: string;
  backAmbience?: readonly [string, string, string];
}
