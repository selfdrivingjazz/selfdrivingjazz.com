import type { CSSProperties } from 'react';
import type { CoverSide } from '../RecordCrate';

/** Three colours sampled from a sleeve's artwork at sync time (see scripts/sync-vault.ts). */
export type Ambience = readonly [string, string, string];

type AmbientStyle = CSSProperties & {
  '--ambient-a': string;
  '--ambient-b': string;
  '--ambient-c': string;
};

function ambienceStyle(ambience: Ambience): AmbientStyle {
  return {
    '--ambient-a': ambience[0],
    '--ambient-b': ambience[1],
    '--ambient-c': ambience[2],
  };
}

interface AmbientFieldProps {
  /** Palette shown now; changing it transitions the `--ambient-*` colours in place. */
  ambience: Ambience;
  /** Index of the item the palette belongs to, exposed as `data-active-index` for diagnostics. */
  activeIndex?: number;
  /** Which face of that item's sleeve the palette came from, exposed as `data-active-side`. */
  activeSide?: CoverSide;
}

/** Fixed, slowly drifting colour field driven by the `--ambient-*` custom properties. */
export default function AmbientField({ ambience, activeIndex, activeSide }: AmbientFieldProps) {
  return (
    <div
      className="ambient-field"
      style={ambienceStyle(ambience)}
      data-active-index={activeIndex}
      data-active-side={activeSide}
      aria-hidden="true"
    >
      <span className="ambient-blob ambient-blob-a" />
      <span className="ambient-blob ambient-blob-b" />
      <span className="ambient-blob ambient-blob-c" />
      <span className="ambient-grain" />
    </div>
  );
}
