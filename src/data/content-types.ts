export interface Project {
  order: number;
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
  content?: string;
}
