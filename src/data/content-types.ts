export interface Project {
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
  content?: string;
}

export interface MethodSection {
  id: string;
  slug: string;
  projectSlug: string;
  title: string;
  copy: string;
  detail: string;
  order: number;
}
