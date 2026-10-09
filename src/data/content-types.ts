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
  ambience: readonly [string, string, string] | null;
  /** CSS background approximating the cover's colours, shown until the image loads. */
  placeholder: string;
  /** Average cover colour (hex), for surfaces that can't use a gradient (WebGL sleeves). */
  coverColor: string;
  content?: string;
}

/** The crate's "older works" sleeve, standing in for releases beyond the featured ones. */
export interface OlderWorksSleeve {
  coverUrl: string;
  coverColor: string;
  backCoverUrl?: string;
}
